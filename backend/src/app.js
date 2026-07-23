import express from "express"
import infrastructureRoutes from "./routes/infrastructure.routes.js"
import dependencyRoutes from "./routes/dependency.routes.js"

/** Configured Express application. */
const app = express()

app.use(express.json())
app.use("/api/infrastructure", infrastructureRoutes)
app.use("/api/dependency", dependencyRoutes)

export default app
