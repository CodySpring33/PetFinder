# PetFinder

OSU Captone Project: https://eecs.engineering.oregonstate.edu/capstone/submission/pages/viewSingleProject.php?id=g3Y16iyxGGeDewQE



## Table of Contents

- [Navigation](#navigation)
- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Usage](#usage)
- [Technology Used](#tech)
- [License](#license)

## Navigation
- You can find all ejs files within the /views folder of the repo which are responsible for html rendering
- The /public folder contains all JavaScript that the site needs to function as well as stylesheets
- Any JavaScript outside of the previously mentioned folders are responsible for hosting and rendering the site as well as database connection.

## Prerequisites

- Install node.js
- Configure MongoDB database
- Configure Amazon S3 database

## Installation

To install and run this application, you will need to have Node.js and npm (Node Package Manager) installed on your computer. Follow these steps to get started:

1. Clone the repository to your local machine using the following command:

```git clone https://github.com/CodySpring33/PetFinder.git```

2. Navigate to the project directory:

```cd your-repository```


3. Install the required dependencies:

```npm install```

4. Edit the `example.env` rename it to `.env` and update the values for use with mongoDB/Amazon S3 and generate a JWT secret

6. Start the application:

```npm start```


## Usage

Run the program:

```npm start```

Navigate to http://localhost:3000/ to see the local version of the app.

## Tech

The project mainly uses the following technologies:

- CSS
- JavaScript
- EJS
- SCSS
- MongoDB
- Amazon S3
- NodeJS
- Gulp


## License

This software is licensed under the [MIT License](LICENSE).
