import db from "../../../db";
import { advocates } from "../../../db/schema";
import { or, ilike, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let query = db.select().from(advocates);

  if (search) {
    const searchPattern = `%${search}%`;
    query = query.where(
      or(
        ilike(advocates.firstName, searchPattern),
        ilike(advocates.lastName, searchPattern),
        ilike(advocates.city, searchPattern),
        ilike(advocates.degree, searchPattern),
        sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(${advocates.specialties}) as specialty
          WHERE specialty ILIKE ${searchPattern}
        )`
        // TODO implement inequality search for yearsOfExperience
      )
    ) as typeof query;
  }

  const data = await query;

  return Response.json({ data });
}
