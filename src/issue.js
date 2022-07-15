import * as github from '@actions/github'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import * as Handlebars from 'handlebars'

import { ISSUE_TITLE, ISSUE_LABEL, ISSUE_STATE_OPEN } from './constants.js'
import { logInfo } from './log.js'

const readFile = promisify(fs.readFile)

async function getLastOpenIssue(token) {
  const octokit = github.getOctokit(token)
  const { owner, repo } = github.context.repo

  const response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
    owner,
    repo,
    creator: 'app/github-actions',
    state: ISSUE_STATE_OPEN,
    sort: 'created',
    direction: 'desc',
    labels: ISSUE_LABEL
  })

  return response.data.length > 0 ? response.data[0] : null
}

async function update(token, body, issueNumber) {
  const octokit = github.getOctokit(token)

  const response = await octokit.rest.issues.update({
    ...github.context.repo,
    issue_number: issueNumber,
    title: ISSUE_TITLE,
    body: body
  })

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
 * @param {*} data the filesOccurrences object
 * @returns the compiled handlebars template as a string
 */
export async function renderIssueBody(data) {
  const templateFilePath = path.resolve(__dirname, 'issue.template.hbs')
  const templateStringBuffer = await readFile(templateFilePath)
  const template = Handlebars.compile(templateStringBuffer.toString())
  return template(data)
}

/**
 * Creates or updates the issue related to the TODOs with the specified body.
 * @param {string} token
 * @param {*} body
 * @returns the created or updated issue
 */
export async function publishIssue(token, body) {
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
