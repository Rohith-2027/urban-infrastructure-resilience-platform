import express from "express"
import infrastructureRoutes from "./routes/infrastructure.routes.js"

/** Configured Express application. */
const app = express()

app.use(express.json())
app.use("/api/infrastructure", infrastructureRoutes)

export default app
