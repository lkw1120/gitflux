# GitFlux

A visual, drag-and-drop CI/CD pipeline builder for GitHub Actions. Build complex workflows with ease using an intuitive interface.

## 🚀 Features

- **Visual Pipeline Builder**: Drag and drop nodes to create GitHub Actions workflows
- **Real-time YAML Preview**: See the generated YAML code as you build your pipeline
- **Pre-built Node Library**: Extensive collection of common GitHub Actions nodes
- **Node Configuration**: Customize each node's parameters through an intuitive interface
- **Dark Mode Support**: Beautiful UI with light and dark theme options
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Pipeline Visualization**: Custom Canvas Implementation
- **Form Handling**: React Hook Form with Zod validation
- **YAML Processing**: js-yaml
- **Icons**: Lucide React, React Icons

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/lkw1120/gitflux.git
cd gitflux
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Usage

### Building a Pipeline

1. **Add Nodes**: Drag nodes from the left toolbox onto the canvas
2. **Connect Nodes**: Click and drag from one node's output to another's input
3. **Configure Nodes**: Select a node and configure its parameters in the right panel
4. **Preview YAML**: Switch to the YAML tab to see the generated GitHub Actions workflow
5. **Export**: Copy the YAML code and use it in your repository's `.github/workflows/` directory

### Available Node Categories

| Category                        | Nodes                                                                                          |
|---------------------------------|------------------------------------------------------------------------------------------------|
| Source Control                  | Checkout, Cache                                                                                |
| Language & Runtime Setup        | Setup Node.js, Setup Java, Setup Python, Setup Go, Setup .NET, Setup Ruby                      |
| Build & Package                 | Gradle Build, Maven Build, Docker Build & Push, Docker Setup Buildx                            |
| Testing & Quality               | Super Linter, Codecov, SonarCloud Scan, Test Reporter                                          |
| Security & Compliance           | Dependency Review, CodeQL Analysis, Snyk Security                                              |
| Cloud & Deployment              | Configure AWS, Azure Login, GCP Auth, Deploy to Vercel, Deploy to Netlify, Deploy to Heroku    |
| Mobile & Desktop                | Android Build, iOS Build, Electron Build                                                       |
| Notifications & Communication   | Slack Notification, Discord Notification, Teams Notification                                   |
| Utilities & Tools               | Upload Artifact, Download Artifact, Create Release, Semantic Release                           |

## 🏗️ Project Structure

```
gitflux/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── pipeline-*.tsx     # Pipeline-related components
│   └── ...
├── lib/                   # Utility functions and data
│   └── github-actions-nodes.json  # Node definitions
├── public/                # Static assets
└── styles/                # Global styles
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [GitHub Actions](https://github.com/features/actions) for the workflow system
- Custom Canvas Implementation for the pipeline visualization
- [Radix UI](https://www.radix-ui.com/) for the component library
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
