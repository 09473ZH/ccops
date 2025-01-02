[English](README.md) | [中文](README.zh-CN.md)

## Development Requirements

- Node.js >= 18
- pnpm >= 8

## Quick Start

```bash
# Clone project
git clone https://github.com/09473ZH/ccops.git

# Enter project directory
cd ccops/frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Project Structure

```
├── frontend/                # Frontend directory
│   ├── src/                # Source code
│   │   ├── api/           # API interfaces
│   │   ├── components/    # Common components
│   │   ├── layouts/       # Layout components
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── package.json       # Project configuration
```

## Docker Deployment

```bash
# Build image
docker build -t ccops-frontend .

# Run container
docker run -p 3001:80 ccops-frontend
```

## Development Standards

### Git Commit Convention

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Testing
- `chore`: Changes to build process or auxiliary tools

## Acknowledgments

Special thanks to [slash-admin](https://github.com/d3george/slash-admin) for providing the excellent scaffold.

## License

[MIT License](LICENSE)

