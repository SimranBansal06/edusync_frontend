# EduSync - Learning Management System

EduSync is a modern learning management system that allows instructors to create courses and assessments, and students to enroll in courses and take assessments.

## Environment Configuration

The application is configured to work with different environments:

### Azure Deployment

This project is configured to work with Azure Static Web Apps and connects to an Azure-hosted backend API. 

The production configuration points to:
- Frontend: https://agreeable-cliff-01fee0e00.6.azurestaticapps.net
- Backend API: https://edusyncbackendapi-e9hrg2a8exgvgwda.centralindia-01.azurewebsites.net

The API URL configuration is set in `src/App.js` using the global `window.API_CONFIG` object.

### Local Development Setup

For local development:

1. Clone the repository
2. Run `npm install` to install dependencies
3. If you need to connect to a local backend, update the `window.API_CONFIG` in `src/App.js` to point to your local API:
   ```javascript
   window.API_CONFIG = {
     BASE_URL: 'https://localhost:7278',
     UPLOADS_PATH: '/uploads'
   };
   ```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## CI/CD Pipeline

This project uses Azure Pipelines for continuous integration and deployment. The pipeline configuration is in the `azure-pipelines-frontend.yml` file.

## Features

- User authentication and authorization (Student and Instructor roles)
- Course creation and management
- Assessment creation and grading
- File uploads and downloads
- Student progress tracking
- Profile management

## API Integration

The application integrates with a .NET Core backend API. The API endpoints are accessed through:
- Direct API calls using axios
- Auth service for authentication
- File service for file uploads and downloads

## Technical Details

- Built with React and React Router
- Uses context API for state management
- Responsive design with custom CSS
- Supports file uploads and downloads
- JWT-based authentication
