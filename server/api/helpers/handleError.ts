import { Response } from 'express'
import fs from 'fs'
import path from 'path'

export default (customMessage: string, err: Error, res: Response) => {
  try {
    const reasonJson = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
    const errorLine = `${new Date().toISOString()} - ${customMessage}:\n${JSON.stringify(reasonJson)}\n\n`
    fs.appendFile(path.join(__dirname, 'error.log'), errorLine, () => { })
    res.status(500).json({ error: customMessage, ...reasonJson })
  } catch (ex) {
    const errorLine = `${new Date().toISOString()} - ${customMessage}:\n${ex}\n\n`
    fs.appendFile(path.join(__dirname, 'error.log'), errorLine, () => { })
    res.status(500).json({ error: customMessage, ex })
    throw err
  } finally {
    console.error(err)
  }
}
