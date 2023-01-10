# Artwork Application
> Social Media Platform
## Info
- Author:          Paul Airuehia
- Date:            December 8, 2022

## Purpose         
This application is built on [node.js] and [MongoDB] in the back end, while the Front-end uses [HTML5] and [CSS3]. 
The Server-side predominantly uses [express] to host the server. The Client-side processing uses [JavaScript]. 
The design is done mainly with [Bootstrap5].

This application is an artwork social media platform that can be used to post and interact with pictures and can be used 
to host courses for other users. This application features two types of users, the users who can view and interact with 
posts and those with additional posting capabilities called "artists". Interactions with posts are done by either 
liking or leaving a review on a post. In addition, users can follow and unfollow any user that is an artist, and they
may also join any of their courses.

## Application Execution

### Requirements
This application requires these programs to run: 
  - [MongoDB]
  - [node.js]

### Installation

Start your MongoDB Database
```sh
mongod -dbpath="THE PATH TO YOUR DATABASE DIRECTORY"
# You may use mongo's shell to view the database directory with this command, but you must have mongosh installed to path
mongosh
```

Install the NPM dependencies and initialize the database to start the server.
```sh
npm install
node ./database-initializer.js
node ./server.js
```

## More Info
> This application is partially RESTful. It incorporates many RESTful concepts, such as the correct use of HTTP status 
> codes and proper routing throughout the server. The server and client do not depend on each other. On the server,
> modules such as morgan help decipher the requests sent throughout the server. When possible, most operations are 
> asynchronous, so the server can handle multiple users making changes simultaneously. The webpage uses Bootstrap's
> dark theme and some added CSS to give the webpage a more modern dark-themed look, with inspiration from Google's 
> Material Dark design for better user interaction.

## Features
- Artists can delete posts or courses
- Notifications bar at the top of the page and Notifications can be deleted
- Error alerts on several pages
- Input validation on the client and server-side
- All input can be entered using the "enter" button on the keyboard
- Main pages have alternating colour themes (Blue and Green Buttons)


[//]: # (links)

   [node.js]: <http://nodejs.org>
   [express]: <http://expressjs.com>
   [HTML5]: <https://developer.mozilla.org/en-US/docs/Glossary/HTML5>
   [CSS3]: <https://developer.mozilla.org/en-US/docs/Web/CSS>
   [MongoDB]: <https://www.mongodb.com/>
   [JavaScript]: <https://developer.mozilla.org/en-US/docs/Web/JavaScript>
   [Bootstrap5]: <https://getbootstrap.com/>
