#!/usr/bin/env node

const entityInfo = require('./entities.json')

const entityStr = Object.keys(entityInfo)
  .filter(entity => entity.match(/;$/))
  .map(entity => entity.replace(/^&|;$/g, ''))
  .reduce((str, entity) => `${str} ${entity}`, '')
  .trim()

process.stdout.write(entityStr)
process.stdout.write('\n')
