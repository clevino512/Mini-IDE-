# Mini IDE Backend

Express.js + TypeScript API server for the Mini IDE desktop application.

## Features

- File management (open, create, save)
- Code execution (Python, JavaScript, C)
- MongoDB integration via Mongoose
- RESTful API endpoints
- Full TypeScript support with strict mode
- Error handling with graceful fallbacks

## Structure

```
backend/
├── src/
│   ├── database/
│   │   └── connection.ts        # MongoDB connection manager
│   ├── models/
│   │   ├── RecentFile.ts        # Mongoose RecentFile schema
│   │   └── Execution.ts         # Mongoose ExecutionLog schema
│   ├── controllers/
│   │   ├── FileController.ts    # File operations logic
│   │   └── ExecutorController.ts# Code execution logic
│   ├── routes/
│   │   ├── file.routes.ts       # File API endpoints
│   │   └── executor.routes.ts   # Execution endpoints
│   ├── utils/
│   │   └── templates.ts         # Code templates
│   ├── types.ts                 # Shared TypeScript types
│   └── index.ts                 # Express app entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

```bash
cd backend
npm install
```

## Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` as needed:
```
MONGODB_URI=mongodb://localhost:27017/mini-ide
PORT=3000
NODE_ENV=development
```

## MongoDB Setup

### Option 1: Docker (Recommended)
```bash
docker run -d -p 27017:27017 --name mini-ide-mongo mongo:latest
```

### Option 2: Local Installation
- Install MongoDB from [mongodb.com](https://mongodb.com)
- Ensure MongoDB is running on localhost:27017

### Option 3: MongoDB Atlas
- Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
- Set MONGODB_URI to your connection string

## Development

### Start development server
```bash
npm run dev
```

Server starts on http://localhost:3000

### Build TypeScript
```bash
npm run build
```

Compiled output goes to `dist/` folder

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Files

**POST /api/file/open**
- Open file from disk
- Body: `{ filepath: string }`
- Response: FileData

**POST /api/file/create**
- Create new file with template
- Body: `{ filename: string, language: 'py'|'c'|'js', filepath: string }`
- Response: FileData

**POST /api/file/save**
- Save file to disk and database
- Body: `{ filepath: string, content: string, language: string }`
- Response: `{ success: boolean }`

**GET /api/file/recents**
- Get 10 recently opened files
- Response: FileData[]

### Code Execution

**POST /api/executor/run**
- Execute code (Python, JavaScript, or C)
- Body: `{ code: string, language: 'py'|'c'|'js', fileId?: string }`
- Response: `{ output: string, error: string, duration: number }`

### Health

**GET /health**
- Server status check
- Response: `{ status: 'ok' }`

## MongoDB Collections

### recent_files
```javascript
{
  _id: ObjectId,
  filename: string,
  filepath: string,
  language: 'py' | 'c' | 'js',
  content: string,
  opened_at: Date,
  created_at: Date
}
```

### execution_history
```javascript
{
  _id: ObjectId,
  file_id: ObjectId,          // ref → recent_files._id (nullable)
  language: 'py' | 'c' | 'js',
  output: string,
  error: string,
  executed_at: Date,
  duration_ms: number
}
```

## Code Execution

### Python
- Language: `'py'`
- Command: `python3`
- Timeout: 10 seconds
- Requirements: Python 3 installed and in PATH

### JavaScript
- Language: `'js'`
- Command: `node`
- Timeout: 10 seconds
- Requirements: Node.js installed

### C
- Language: `'c'`
- Compile: `gcc`
- Timeout: 10 seconds per compilation + 10 seconds execution
- Requirements: GCC installed and in PATH

## Error Handling

- MongoDB connection failures are non-fatal
- Missing compilers return clear error messages
- Execution timeouts kill process after 10 seconds
- All errors logged with context

## Logging

Console output uses:
- `console.warn()` for info and warnings
- `console.error()` for errors

## Integration with Electron

The Electron main process (`src/main/`) contains identical controllers and models:
- Shared database connection
- Same Mongoose schemas
- Same business logic
- IPC handlers instead of HTTP routes

Both backend and Electron main process write to the same MongoDB instance.

## Development Tips

1. Keep controllers lean - business logic only
2. All async operations are typed with Promise<T>
3. No `any` types except where unavoidable
4. Use path.join() for file paths, never string concatenation
5. Temp files prefixed with `_ide_` to avoid conflicts
6. All error messages in French for consistency

## Troubleshooting

### MongoDB Connection Failed
```
⚠️ MongoDB indisponible, mode sans persistance
```
- Check MongoDB is running
- Verify MONGODB_URI in .env
- Try `docker run -p 27017:27017 mongo:latest`

### Code Won't Execute
- Check PATH includes Python 3, Node.js, GCC
- Test: `python3 --version`, `node --version`, `gcc --version`
- Windows: May need mingw-w64 or MSVC build tools

### Port Already in Use
```bash
# macOS/Linux: Find and kill process
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows:
netstat -aon | findstr :3000
taskkill /PID <PID> /F
```

## Performance

- File operations: < 10ms
- Code compilation: Varies (typically < 500ms)
- Code execution: Up to 10 seconds
- Database queries: < 50ms
- API response time: Usually < 100ms

## Security Notes

- No input validation on code execution (it's a local app)
- MongoDB should use authentication in production
- Temp files cleaned up after execution
- No sensitive data in logs

## License

MIT
