import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { connectDB } from './database/connection'
import fileRoutes from './routes/file.routes'
import executorRoutes from './routes/executor.routes'

// Charger les variables d'env depuis .env
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.use('/api/file', fileRoutes)
app.use('/api/executor', executorRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

async function start() {
  await connectDB()

  app.listen(PORT, () => {
    console.warn(`🚀 Backend running on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('❌ Erreur démarrage:', err)
  process.exit(1)
})
