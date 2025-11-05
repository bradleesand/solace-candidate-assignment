import { sql } from "drizzle-orm";
import {
  pgTable,
  integer,
  text,
  serial,
  timestamp,
  bigint,
  customType,
} from "drizzle-orm/pg-core";

// Custom JSONB type to fix serialization bug with postgres-js
// See: https://github.com/drizzle-team/drizzle-orm/issues/724
const customJsonb = <TData>(name: string) =>
  customType<{ data: TData; driverData: TData }>({
    dataType() {
      return "jsonb";
    },
    toDriver(value: TData): TData {
      return value;
    },
  })(name);

const advocates = pgTable("advocates", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  city: text("city").notNull(),
  degree: text("degree").notNull(),
  specialties: customJsonb<string[]>("payload").default(sql`'[]'::jsonb`).notNull(),
  yearsOfExperience: integer("years_of_experience").notNull(),
  phoneNumber: bigint("phone_number", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export { advocates };
