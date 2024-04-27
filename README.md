<h1>CodeC getting started guide</h1>
<p>CodeC currently uses multiple node versions, so nvm is a must. Node verion
    16.20.2 and Node version 21.7.1. The former is used for the backend api and
    the latter for the client side that uses NextJS as the framework

<h2>Prerequisites</h2>
<ol>
    <li><code>docker</code> should be installed in your machine</li>
    <li><code>nvm</code> should be used for node version control</li>
</ol>

<h2>Quick start: How to run</h2>
<ol>
    <li><code>git clone <a>https://github.com/mosnamarco/CodeC.git</a></code></li>
    <li>cd into cloned repo</li>
</ol>

<h3>For server</h3>
<ol>
    <li><code>cd server</code></li>
    <li><code>nvm use 16.20.2</code></li>
    <li><code>npm i && npm run devt</code></li>
</ol>

<h3>For client</h3>
<ol>
    <li><code>cd client</code></li>
    <li><code>nvm use 21.7.1</code></li>
    <li><code>npm i && npm run dev</code></li>
</ol>

<h3>For Judge0</h3>
<ol>
    <li>cd into judge0 folder in server folder</li>
    <li><code>docker compose up</code></li>
</ol>

