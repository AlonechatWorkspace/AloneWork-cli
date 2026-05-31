import { z } from "zod"
import { fn } from "./util/fn"
import { Subscription } from "./subscription"

export namespace LiteData {
  export const getLimits = fn(z.void(), () => {
    return Subscription.getLimits()["lite"]
  })

  export const planName = fn(z.void(), () => "lite")
}
