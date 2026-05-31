import { z } from "zod"
import { fn } from "./util/fn"
import { BlackPlans } from "./schema/billing.sql"
import { Subscription } from "./subscription"

export namespace BlackData {
  export const getLimits = fn(
    z.object({
      plan: z.enum(BlackPlans),
    }),
    ({ plan }) => {
      return Subscription.getLimits()["black"][plan]
    },
  )
}
