# Feedback: Flag Service Costs and Constraints Before Signup

When setting up any external service account (EAS, Apple Developer, hosting, APIs, etc.), explicitly present:

1. **Pricing tiers** — What does free get you? What are the paid options?
2. **Usage limits** — Build caps, rate limits, MAU limits. Be specific.
3. **Hidden constraints** — Queue priority, time-of-day effects, platform splits (e.g., 30 builds but only 15 iOS).
4. **Cost trajectory** — How quickly will we hit the free tier ceiling at our current pace?

Do not silently sign up for a free tier and let the user discover the constraints mid-workflow. Present the tradeoffs upfront so the user can make an informed decision about which tier to start on.

## Example (EAS Build)

Should have said: "Free tier gives 15 iOS builds/month with lower-priority queue (can wait 1+ hours during US business hours). Starter at $19/month gets priority queue. At our iteration pace, we'll use 15 builds in about 2 weeks."
