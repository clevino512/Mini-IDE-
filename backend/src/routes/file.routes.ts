import { Router, Request, Response } from 'express'
import { FileController } from '../controllers/FileController'
import { CreateFileInput, SaveFileInput } from '../types'

const router = Router()

router.post('/open', async (req: Request, res: Response) => {
  try {
    const { filepath } = req.body

    if (!filepath) {
      return res.status(400).json({ error: 'filepath requis' })
    }

    const file = await FileController.openFile(filepath)
    res.json(file)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.post('/create', async (req: Request, res: Response) => {
  try {
    const data: CreateFileInput = req.body

    if (!data.filename || !data.language || !data.filepath) {
      return res.status(400).json({ error: 'filename, language, filepath requis' })
    }

    const file = await FileController.createFile(data)
    res.json(file)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.post('/save', async (req: Request, res: Response) => {
  try {
    const data: SaveFileInput = req.body

    if (!data.filepath || !data.content || !data.language) {
      return res.status(400).json({ error: 'filepath, content, language requis' })
    }

    const result = await FileController.saveFile(data)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.get('/recents', async (req: Request, res: Response) => {
  try {
    const files = await FileController.getRecents()
    res.json(files)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
