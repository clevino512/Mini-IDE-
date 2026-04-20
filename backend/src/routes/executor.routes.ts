import { Router, Request, Response } from 'express'
import { ExecutorController } from '../controllers/ExecutorController'
import { RunCodeInput } from '../types'

const router = Router()

router.post('/run', async (req: Request, res: Response) => {
  try {
    const data: RunCodeInput = req.body

    if (!data.code || !data.language) {
      return res.status(400).json({ error: 'code et language requis' })
    }

    const result = await ExecutorController.runCode(data)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
