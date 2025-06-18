import { z } from "zod"

export const domainAnalysisSchema = z.object({
  url: z
    .string()
    .describe(
      "The full URL that was analyzed (e.g., https://example.com). This should be the primary domain provided for analysis. Ensure this is a valid, complete URL string.",
    ),
  vertical: z
    .string()
    .max(100)
    .describe(
      "The primary business vertical of the website, concisely described (e.g., 'E-commerce Fashion Retail', 'SaaS Project Management'). Aim for 2-4 impactful words.",
    ),
  gmv: z
    .number()
    .int()
    .min(0)
    .describe(
      "A numerical estimate of the annual Gross Merchandise Value (GMV) in USD. This should be a single integer (e.g., 750000 for $750K, 3000000 for $3M). If GMV is not applicable or cannot be reasonably estimated as a number, use 0.",
    ),
  products: z
    .string()
    .describe(
      "A summary of the main products or services offered, including typical price points, pricing tiers, or pricing strategy if observable (e.g., 'Sells handmade jewelry, prices $50-$300', 'Offers tiered subscription: Basic $10/mo, Pro $30/mo', 'Provides free educational content').",
    ),
  desc: z
    .string()
    .describe(
      "A short, compelling description (1-3 sentences) of the website's core business, value proposition, and target audience.",
    ),
  country: z
    .string()
    .length(2, { message: "Country code must be exactly 2 characters." })
    .regex(/^[A-Z]{2}$/, {
      message: "Country code must be two uppercase letters (ISO 3166-1 alpha-2).",
    })
    .describe(
      "The two-letter ISO 3166-1 alpha-2 country code where the company is primarily based or headquartered (e.g., 'US', 'GB', 'DE'). If unknown or truly global with no primary base, use 'XX'.",
    ),
})

export type DomainAnalysis = z.infer<typeof domainAnalysisSchema>
