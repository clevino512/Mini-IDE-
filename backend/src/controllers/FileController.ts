import * as fs from 'fs'
import * as path from 'path'
import { RecentFileModel } from '../models/RecentFile'
import { TEMPLATES } from '../utils/templates'
import { FileData, CreateFileInput, SaveFileInput, Language } from '../types'
import { isConnected } from '../database/connection'

export class FileController {
  static async openFile(filepath: string): Promise<FileData | null> {
    try {
      if (!fs.existsSync(filepath)) {
        throw new Error(`Fichier non trouvé: ${filepath}`)
      }

      const content = fs.readFileSync(filepath, 'utf-8')
      const filename = path.basename(filepath)
      const ext = path.extname(filename).slice(1)
      const language = (ext === 'py' ? 'py' : ext === 'c' ? 'c' : 'js') as Language

      if (isConnected()) {
        try {
          const doc = await RecentFileModel.findOneAndUpdate(
            { filepath },
            {
              filename,
              filepath,
              language,
              content,
              opened_at: new Date(),
            },
            { upsert: true, new: true }
          )

          return {
            _id: doc._id.toString(),
            filename: doc.filename,
            filepath: doc.filepath,
            language: doc.language,
            content: doc.content,
            opened_at: doc.opened_at.toISOString(),
            created_at: doc.created_at.toISOString(),
          }
        } catch (mongoErr) {
          console.warn('⚠️ Erreur MongoDB:', (mongoErr as Error).message)
        }
      }

      return {
        filename,
        filepath,
        language,
        content,
      }
    } catch (err) {
      console.error('❌ Erreur ouverture fichier:', (err as Error).message)
      throw err
    }
  }

  static async createFile(data: CreateFileInput): Promise<FileData> {
    try {
      const { filename, language, filepath } = data
      const template = TEMPLATES[language]

      if (!fs.existsSync(path.dirname(filepath))) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true })
      }

      fs.writeFileSync(filepath, template)

      if (isConnected()) {
        try {
          const doc = await RecentFileModel.create({
            filename,
            filepath,
            language,
            content: template,
            opened_at: new Date(),
            created_at: new Date(),
          })

          return {
            _id: doc._id.toString(),
            filename: doc.filename,
            filepath: doc.filepath,
            language: doc.language,
            content: doc.content,
            opened_at: doc.opened_at.toISOString(),
            created_at: doc.created_at.toISOString(),
          }
        } catch (mongoErr) {
          console.warn('⚠️ Erreur MongoDB:', (mongoErr as Error).message)
        }
      }

      return {
        filename,
        filepath,
        language,
        content: template,
      }
    } catch (err) {
      console.error('❌ Erreur création fichier:', (err as Error).message)
      throw err
    }
  }

  static async saveFile(data: SaveFileInput): Promise<{ success: boolean }> {
    try {
      const { filepath, content, language } = data

      fs.writeFileSync(filepath, content)

      if (isConnected()) {
        try {
          await RecentFileModel.findOneAndUpdate(
            { filepath },
            {
              content,
              opened_at: new Date(),
            },
            { upsert: true }
          )
        } catch (mongoErr) {
          console.warn('⚠️ Erreur MongoDB:', (mongoErr as Error).message)
        }
      }

      return { success: true }
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', (err as Error).message)
      throw err
    }
  }

  static async getRecents(): Promise<FileData[]> {
    try {
      if (!isConnected()) {
        return []
      }

      const docs = await RecentFileModel.find().sort({ opened_at: -1 }).limit(10).lean()

      return docs.map((doc: any) => ({
        _id: doc._id.toString(),
        filename: doc.filename,
        filepath: doc.filepath,
        language: doc.language,
        content: doc.content,
        opened_at: new Date(doc.opened_at).toISOString(),
        created_at: new Date(doc.created_at).toISOString(),
      }))
    } catch (err) {
      console.error('❌ Erreur récupération recents:', (err as Error).message)
      return []
    }
  }
}
