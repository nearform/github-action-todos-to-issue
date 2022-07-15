'use strict'
const github = require('@actions/github')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const handlebars = require('handlebars')

const { ISSUE_TITLE, ISSUE_LABEL, STATE_OPEN } = require('./constants')
const { logInfo } = require('./log')

async function getLastOpenIssue(token) {
  const octokit = github.getOctokit(token)
  const { owner, repo } = github.context.repo

  const response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
    owner,
    repo,
    creator: 'app/github-actions',
    state: STATE_OPEN,
    sort: 'created',
    direction: 'desc',
    labels: ISSUE_LABEL
  })

  return response.data.length > 0 ? response.data[0] : null
}

async function update(token, body, issueNumber) {
  const octokit = github.getOctokit(token)
  const { owner, repo } = github.context.repo

  const response = await octokit.request(
    `PATCH /repos/{owner}/{repo}/issues/${issueNumber}`,
    {
      owner,
      repo,
      title: ISSUE_TITLE,
      body: body
    }
  )

  return response.data ? response.data : null
}

async function create(token, body) {
  const octokit = github.getOctokit(token)

  const response = await octokit.rest.issues.create({
    ...github.context.repo,
    title: ISSUE_TITLE,
    body: body,
    labels: [ISSUE_LABEL]
  })

  return response.data
}

/**
 * Renders the body using the Handlebars provided template
 * @param {*} data the filesOccurrencies object
 * @returns the compiled handlebars template as a string
 */
async function renderIssueBody(data) {
  const templateFilePath = path.resolve(__dirname, 'issue.template.hbs')
  const templateStringBuffer = await readFile(templateFilePath)
  const template = handlebars.compile(templateStringBuffer.toString())
  return template(data)
}

/**
 * Creates or updates the issue related to the TODOs with the specified body.
 * @param {string} token
 * @param {*} body
 * @returns the created or updated issue
 */
async function publishIssue(token, body) {
  let issue = await getLastOpenIssue(token)
  if (issue) {
    issue = await update(token, body, issue.number)
    logInfo(`Existing TODOs issue ${issue.number} has been updated.`)
  } else {
    issue = await create(token, body)
    logInfo(`New TODOs issue ${issue.number} has been created.`)
  }

  return issue
}

module.exports = {
  renderIssueBody,
  publishIssue
}
