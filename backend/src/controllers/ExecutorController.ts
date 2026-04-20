import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'
import { app } from 'electron'
import { ExecutionLogModel } from '../models/Execution'
import { RunCodeInput, ExecutionResult, RawResult, Language } from '../types'
import { isConnected } from '../database/connection'
import os from 'os'

export class ExecutorController {
  static async runCode(input: RunCodeInput): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      let result: RawResult

      switch (input.language) {
        case 'py':
          result = await this.runPython(input.code)
          break
        case 'js':
          result = await this.runJavaScript(input.code)
          break
        case 'c':
          result = await this.runC(input.code)
          break
        default:
          throw new Error(`Langage non supporté: ${input.language}`)
      }

      const duration = Date.now() - startTime

      await this.logExecution(input, result, duration)

      return {
        output: result.output,
        error: result.error,
        duration,
      }
    } catch (err) {
      const duration = Date.now() - startTime
      const errorMsg = (err as Error).message

      return {
        output: '',
        error: errorMsg,
        duration,
      }
    }
  }

  private static async runPython(code: string): Promise<RawResult> {
    const tmpFile = path.join(os.tmpdir(), '_ide_run.py')
    fs.writeFileSync(tmpFile, code)

    try {
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
      return await this.spawnProcess(pythonCmd, [tmpFile], 10000)
    } catch (err) {
      const errMsg = (err as Error).message
      const isMissing = errMsg.includes('ENOENT') || errMsg.includes('not found')

      if (isMissing) {
        return {
          output: '',
          error: '❌ Commande introuvable: python\nVérifiez que Python 3 est installé et dans le PATH',
        }
      }

      throw err
    }
  }

  private static async runJavaScript(code: string): Promise<RawResult> {
    const tmpFile = path.join(os.tmpdir(), '_ide_run.js')
    fs.writeFileSync(tmpFile, code)

    try {
      return await this.spawnProcess('node', [tmpFile], 10000)
    } catch (err) {
      const errMsg = (err as Error).message
      const isMissing = errMsg.includes('ENOENT') || errMsg.includes('not found')

      if (isMissing) {
        return {
          output: '',
          error: '❌ Commande introuvable: node\nVérifiez que Node.js est installé et dans le PATH',
        }
      }

      throw err
    }
  }

  private static async runC(code: string): Promise<RawResult> {
    const tmpSrc = path.join(os.tmpdir(), '_ide_run.c')
    const tmpBin = path.join(os.tmpdir(), '_ide_out' + (process.platform === 'win32' ? '.exe' : ''))

    fs.writeFileSync(tmpSrc, code)

    try {
      // ✅ Chemins GCC possibles sur Windows (avec fallback)
      const gccCmds = process.platform === 'win32'
        ? [
            'gcc',
            'C:\\msys64\\ucrt64\\bin\\gcc.exe',
            'C:\\msys64\\mingw64\\bin\\gcc.exe',
            'C:\\MinGW\\bin\\gcc.exe',
          ]
        : ['gcc']

      for (const gccCmd of gccCmds) {
        try {
          const compileResult = await this.spawnProcess(gccCmd, [tmpSrc, '-o', tmpBin], 10000)

          if (compileResult.error) {
            return {
              output: '',
              error: '❌ Erreur de compilation:\n' + compileResult.error,
            }
          }

          return await this.spawnProcess(tmpBin, [], 10000)
        } catch (err) {
          const errMsg = (err as Error).message
          const isMissing = errMsg.includes('ENOENT') || errMsg.includes('not found')

          if (isMissing) continue

          throw err
        }
      }

      return {
        output: '',
        error: [
          '❌ GCC introuvable',
          'Chemins essayés : ' + gccCmds.join(', '),
          'Installation :',
          '  Windows : installez MinGW ou MSYS2',
          '  Linux   : sudo apt install gcc',
          '  Mac     : xcode-select --install',
        ].join('\n'),
      }
    } finally {
      try { fs.unlinkSync(tmpSrc) } catch { /* ignore */ }
      try { fs.unlinkSync(tmpBin) } catch { /* ignore */ }
    }
  }

  private static spawnProcess(
    cmd: string,
    args: string[],
    timeout: number = 10000
  ): Promise<RawResult> {
    return new Promise((resolve, reject) => {
      let output = ''
      let error = ''
      let timedOut = false

      const child = spawn(cmd, args)

      const timer = setTimeout(() => {
        timedOut = true
        child.kill('SIGTERM')
      }, timeout)

      child.stdout?.on('data', (data) => {
        output += data.toString()
      })

      child.stderr?.on('data', (data) => {
        error += data.toString()
      })

      child.on('close', (code) => {
        clearTimeout(timer)

        if (timedOut) {
          return resolve({
            output,
            error: '⏱ Timeout: exécution dépassée (10s)',
          })
        }

        resolve({ output, error })
      })

      child.on('error', (err) => {
        clearTimeout(timer)
        reject(err)
      })
    })
  }

  private static async logExecution(
    input: RunCodeInput,
    result: RawResult,
    duration: number
  ): Promise<void> {
    if (!isConnected()) {
      return
    }

    try {
      await ExecutionLogModel.create({
        file_id: input.fileId || null,
        language: input.language,
        output: result.output,
        error: result.error,
        executed_at: new Date(),
        duration_ms: duration,
      })
    } catch (err) {
      console.warn('⚠️ Erreur sauvegarde exécution:', (err as Error).message)
    }
  }
}
