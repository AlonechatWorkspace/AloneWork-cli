import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { Database } from "./drizzle"
import { ModelTable } from "./schema/model.sql"
import { Identifier } from "./identifier"
import { fn } from "./util/fn"
import { Actor } from "./actor"

export namespace Model {
  export const enable = fn(z.object({ model: z.string() }), ({ model }) => {
    Actor.assertAdmin()
    return Database.use((db) =>
      db.delete(ModelTable).where(and(eq(ModelTable.workspaceID, Actor.workspace()), eq(ModelTable.model, model))),
    )
  })

  export const disable = fn(z.object({ model: z.string() }), ({ model }) => {
    Actor.assertAdmin()
    return Database.use((db) =>
      db
        .insert(ModelTable)
        .values({
          id: Identifier.create("model"),
          workspaceID: Actor.workspace(),
          model: model,
        })
        .onDuplicateKeyUpdate({
          set: {
            timeDeleted: null,
          },
        }),
    )
  })

  export const listDisabled = fn(z.void(), () => {
    return Database.use((db) =>
      db
        .select({ model: ModelTable.model })
        .from(ModelTable)
        .where(eq(ModelTable.workspaceID, Actor.workspace()))
        .then((rows) => rows.map((row) => row.model)),
    )
  })

  export const isDisabled = fn(
    z.object({
      model: z.string(),
    }),
    ({ model }) => {
      return Database.use(async (db) => {
        const result = await db
          .select()
          .from(ModelTable)
          .where(and(eq(ModelTable.workspaceID, Actor.workspace()), eq(ModelTable.model, model)))
          .limit(1)

        return result.length > 0
      })
    },
  )
}
