# Contributing

Thank you for your interest in contributing to this project! We welcome contributions from the community. Please follow the guidelines below to ensure a smooth collaboration.

## Requirements

- Node.js >=22.12.0
- npm


## Development Setup

Install dependencies
```bash
npm ci
```

## Development

Refer to the [package.json](./package.json) scripts for available commands.

### Building the Project

```bash
# Install dependencies
npm run build
```

### Running Tests

```bash
# Run unit tests
npm run test:unit

# Run ntc-templates compatibility tests
npm run test:compat
```

### Code Formatting and Linting

```bash
# Format code
npm run fmt

# Lint code
npm run lint
```


## Ways to Contribute
We welcome and appreciate any form of contributions:

### Bug Report or Issue
Report bugs, unexpected behavior, performance issues, and edge cases that are not handled correctly.

### Documentation or Translation Contributions
Improve documentation, fix typos, clarify explanations, or add and maintain translations.

### Testing and Feedback
Share test results, usage feedback, and reports about real-world usage scenarios. This helps us identify issues and improve the project.


## How to Submit
- Use the GitHub repository for issues, discussions, and pull requests.
- Open a Discussion when you want to share feedback or discuss an idea before implementation.
- If you already have an implementation, link the related issue in your Pull Request.


## Pull Requests
Link your PR to the related issue.
Run npm run check:fix and npm run test:unit before submitting.
Keep each PR focused on a single concern.


## License
By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
