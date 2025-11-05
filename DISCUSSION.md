# Setup Database
1. I uncommented the lines mentioned in README.md to enable using the database instead of the default list of advocates.
2. The docker container had an error because the volume location was incorrect. I fixed the volume location in docker-compose.yml and the database started correctly.
3. Pushing the schema and seeding the database worked correctly after that.

# page.tsx
1. I added types for the advocates state using Drizzle ORM's InferSelectModel to ensure type safety when working with advocate data.
2. I added unique keys to the dynamically generated list items in the table to satisfy React's requirement for list item keys.
3. I added a presence check for the search-term element to avoid potential runtime errors if the element is not found in the DOM.
4. Since yearsOfExperience is a number, I ensured that the search term comparison converts it to a string for accurate filtering.
5. Since specialties is an array, I modified the filtering logic to check if any specialty includes the search term, allowing for more flexible searches.
6. I added a type to the onChange event handler for the search input to ensure proper typing in TypeScript.