"use server"

import { RefreshToken } from "@/utilities/apiService"

export async function TokenRefresh() {
  await RefreshToken()
}
