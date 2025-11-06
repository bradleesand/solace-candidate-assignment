import db from "../../../db";
import { advocates } from "../../../db/schema";
import { or, ilike, sql, count } from "drizzle-orm";

const DEFAULT_PAGE_SIZE = 25;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_PAGE_SIZE;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  let query = db.select().from(advocates);
  let countQuery = db.select({ count: count() }).from(advocates);

  // Apply search filters to both queries
  if (search) {
    const searchPattern = `%${search}%`;
    const whereCondition = or(
      ilike(advocates.firstName, searchPattern),
      ilike(advocates.lastName, searchPattern),
      ilike(advocates.city, searchPattern),
      ilike(advocates.degree, searchPattern),
      sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(${advocates.specialties}) as specialty
        WHERE specialty ILIKE ${searchPattern}
      )`
      // TODO implement inequality search for yearsOfExperience
    );

    query = query.where(whereCondition) as typeof query;
    countQuery = countQuery.where(whereCondition) as typeof countQuery;
  }

  // Apply pagination
  query = query.limit(limit).offset(offset) as typeof query;

  // Execute both queries
  const [data, totalResult] = await Promise.all([query, countQuery]);
  const total = totalResult[0].count;

  return Response.json({ data, total });
}
