#!/usr/bin/env node

import fs from 'fs'
import yaml from 'js-yaml'
import sharp from 'sharp'
import chalk from 'chalk'

import { parseAnnotation, generateAnnotation } from '@allmaps/annotation'
import { generateId } from '@allmaps/id'

import { scaleMap, createManifest } from './lib.js'

const serverBaseUrl = 'http://localhost:5550'

const annotationUrls = yaml.load(fs.readFileSync('./annotations.yaml', 'utf8'))

const manifests = {}

console.log(
  chalk.bgCyanBright.black(' Creating IIIF Image API Level 0 tiles \n')
)

for (const {
  url: annotationUrl,
  manifests: manifestNames,
  tags
} of annotationUrls) {
  console.log('Annotation:', chalk.green(annotationUrl))
  console.log(
    '  Fetching annotation:',
    chalk.yellowBright.underline(annotationUrl)
  )
  const annotation = await fetch(annotationUrl).then((response) =>
    response.json()
  )

  const maps = parseAnnotation(annotation)
  const map = maps[0]

  const imageId = map.resource.id
  const allmapsImageId = await generateId(imageId)
  const fullImageUrl = `${imageId}/full/full/0/default.jpg`

  console.log(
    '  Fetching full size image:',
    chalk.yellowBright.underline(fullImageUrl)
  )
  const imageArrayBuffer = await fetch(fullImageUrl).then((response) =>
    response.arrayBuffer()
  )

  const newImageId = `${serverBaseUrl}/iiif/${allmapsImageId}`
  console.log(
    '  Creating IIIF Image API Level 0 tiles:',
    chalk.yellowBright.underline(`${newImageId}/info.json`)
  )

  const image = await sharp(imageArrayBuffer).tile({
    layout: 'iiif',
    size: 768,
    id: `${serverBaseUrl}/iiif`
  })

  const metadata = await image.metadata()

  const scaledMap = scaleMap(map, metadata.width, metadata.height)

  await image.toFile(`./iiif/${allmapsImageId}`)

  const newAnnotationId = `${serverBaseUrl}/annotations/${allmapsImageId}.json`

  const newMap = {
    ...scaledMap,
    id: newAnnotationId,
    resource: {
      ...scaledMap.resource,
      id: newImageId
    }
  }

  const newAnnotation = generateAnnotation([newMap])

  fs.writeFileSync(
    `./annotations/${allmapsImageId}.json`,
    JSON.stringify(newAnnotation, null, 2)
  )

  if (manifestNames) {
    for (const manifestName of manifestNames) {
      if (!manifests[manifestName]) {
        manifests[manifestName] = []
      }

      manifests[manifestName].push({
        imageId: newImageId,
        width: metadata.width,
        height: metadata.height
      })
    }
  }

  console.log(chalk.green('  Done!\n'))
}

console.log(chalk.bgCyanBright.black(' Creating IIIF Manifests \n'))

for (let [manifestName, images] of Object.entries(manifests)) {
  const manifestId = `${serverBaseUrl}/manifests/${manifestName}.json`

  const manifest = createManifest(manifestId, images)

  console.log(
    'Creating IIIF Manifest:',
    chalk.yellowBright.underline(manifestId)
  )

  fs.writeFileSync(
    `./manifests/${manifestName}.json`,
    JSON.stringify(manifest, null, 2)
  )
}

console.log(chalk.rgb(123, 200, 67).underline('Done!\n'))
