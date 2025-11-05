# Claude Code Usage
I used Claude Code extensively to help me with this assignment. My workflow consisted of manually reading the code to understand how it worked and identify issues or improvements that could be made. Then I would prompt Claude with specific requests to generate code snippets or explanations. I would review the generated code, make any necessary adjustments, and integrate it into the project. This iterative process allowed me to leverage Claude's capabilities while ensuring the final code met my standards and requirements. I also extensively used Claude to help me write this documentation.

# Setup Database
1. I uncommented the lines mentioned in README.md to enable using the database instead of the default list of advocates.
2. The docker container had an error because the volume location was incorrect. I fixed the volume location in docker-compose.yml and the database started correctly. (Claude helped me identify and fix the issue.)
3. Pushing the schema and seeding the database seemed to work correctly after that. (I later noticed that the specialties field was not being stored correctly, so I had to fix that later as described below.)

# page.tsx
1. I added types for the advocates state using Drizzle ORM's InferSelectModel to ensure type safety when working with advocate data. (I knew I needed to add type safety. Claude helped me figure out the exact syntax to use.)
2. I added unique keys to the dynamically generated list items in the table to satisfy React's requirement for list item keys. (This is always one of the first things I check for when working with React code.)
3. I changed how the search term is displayed by using state and React rendering instead of manipulating the DOM directly.
4. Since yearsOfExperience is a number, I ensured that the search term comparison converts it to a string for accurate filtering. (I later changed the search to be server-side, but this was still a necessary fix for the original client-side search implementation.)
5. Since specialties is an array, I modified the filtering logic to check if any specialty includes the search term, allowing for more flexible searches. (Again, I later changed the search to be server-side, but this was still a necessary fix for the original client-side search implementation.)
6. I added a type to the onChange event handler for the search input to ensure proper typing in TypeScript.
7. Fixed hydration error by wrapping <th> elements in a <tr> within the <thead>.

# Styling
1. I told Claude to "Use tailwind classes to add styling to page.tsx" and it added several tailwind classes to improve the appearance of the page. I may go through and tweak these but they look pretty good for now and design is not my forte. If given any kind of reference like a Figma design or even just looking at the existing style already in place in the app, I could easily nail the desired look, but I'm not good at coming up with good design from scratch.
2. I noticed that the header and body cell classes were repeated so I wanted to DRY them up. I created separate variables for headerCellClasses and cellClasses.

# Seed route
My IDE was complaining about "insert" not existing on the db object because the mock that is returned if DATABASE_URL is not set does not have an insert method. Since this kind of mocking wouldn't be used in a production-ready app, I decided to just remove that mock and instead throw an error if DATABASE_URL is not set. This way the db object is always a proper Drizzle ORM database instance and has all the expected methods.

# Server-side search
I implemented a server-side search feature to improve performance with large datasets. The search input now triggers a fetch request to the server with the search term as a query parameter. The server processes the request, queries the database for matching advocates, and returns the filtered results to the client for display. This approach reduces the amount of data sent to the client and leverages the database's querying capabilities for efficient searching.

## Debouncing
To prevent excessive API calls while typing in the search input, I implemented debouncing using the useDebounce hook from the use-debounce library. This ensures that the fetch request is only sent after the user has stopped typing for a specified delay (300 milliseconds in this case), reducing unnecessary network requests and improving performance.

## AbortController
To handle rapid successive searches, I implemented an AbortController to cancel any ongoing fetch requests when a new search is initiated.

## Specialties field
I made sure the server-side search considers the specialties array when filtering advocates.

### How the search works
The server checks if any specialty in the array includes the search term, allowing for more comprehensive search results. Since the query for specialties is a little more complex, I asked Claude to explain the query:

The specialties JSONB search query:

```sql
EXISTS (
  SELECT 1 FROM jsonb_array_elements_text(${advocates.specialties}) as specialty
  WHERE specialty ILIKE ${searchPattern}
)
```

**How it works:**

1. **`jsonb_array_elements_text(${advocates.specialties})`**
   - This is a PostgreSQL function that takes a JSONB array and expands it into a set of rows
   - Each element in the array becomes a separate row of text
   - Example: If specialties is `["Cardiology", "Emergency Medicine"]`, this function returns:
     - Row 1: "Cardiology"
     - Row 2: "Emergency Medicine"

2. **`as specialty`**
   - Gives the column alias "specialty" to each expanded row
   - This allows us to reference each individual specialty value

3. **`WHERE specialty ILIKE ${searchPattern}`**
   - Checks each individual specialty against the search pattern
   - `ILIKE` is case-insensitive pattern matching in PostgreSQL
   - `${searchPattern}` is `%search%` which means "contains the search term anywhere"
   - Example: If search is "cardio", it matches "Cardiology", "CARDIOLOGY", "Cardiovascular", etc.

4. **`EXISTS (SELECT 1 FROM ...)`**
   - `EXISTS` returns `true` if the subquery returns at least one row
   - `SELECT 1` is just a dummy value - we don't care what value is returned, only if a row exists
   - So this whole expression returns `true` if ANY specialty in the array matches the search term

**Concrete Example:**

If an advocate has `specialties: ["Cardiology", "Pediatrics"]` and the user searches for "cardio":

1. `jsonb_array_elements_text` expands to:
   - "Cardiology"
   - "Pediatrics"
2. Check "Cardiology" ILIKE "%cardio%" → ✅ Match!
3. `EXISTS` returns `true` because at least one match was found
4. This advocate is included in the results

If the search was "surgery", neither specialty matches, `EXISTS` returns `false`, and the advocate is excluded.

### JSONB Drizzle ORM Bug
Drizzle ORM has a known bug with postgres-js where JSONB columns get double-encoded. When you insert an array like `["item1", "item2"]`, Drizzle would stringify it, causing PostgreSQL to store it as a JSONB string value `"[\"item1\",\"item2\"]"` instead of a proper JSONB array.

#### The Process
1. I noticed that my search query for specialties was throwing an error.
2. I checked the database directly and saw that the specialties field was stored incorrectly as a string instead of an array.
3. Claude researched the issue and found that it was a known bug with Drizzle ORM when using the postgres-js driver.
4. Claude suggested creating a custom JSONB type that bypasses Drizzle's default stringification behavior.

#### The First Solution
Created a custom JSONB type that passes values directly to the
postgres-js driver without stringifying them:

File: `src/db/schema.ts`
- Added customJsonb helper that returns the raw value in toDriver()

- This lets postgres-js handle the JSONB serialization correctly
- Updated the specialties field to use customJsonb<string[]>
instead of jsonb()

##### The Result
After implementing the custom JSONB type and reseeding the database, the specialties field was stored correctly as a proper JSONB array. The server-side search for specialties worked as intended, allowing users to search advocates by their specialties.

#### Better Solution
After looking more closely into the Github Issue, I realized that we actually just needed to update Drizzle ORM to 0.33.0 or later, as the bug had been fixed in that version. So I updated Drizzle ORM to the latest version and reverted the custom JSONB type back to using the built-in jsonb() helper.

#### Reseeding the Database
Obviously, in a production app, we couldn't just reseed the database like this without losing data. We would need to write a migration script to fix existing records. But for this assignment, reseeding was sufficient to demonstrate the functionality.

