// TODO: move to stdlib
export function scaleMap(map, width, height) {
  const scale = map.resource.width / width
  console.log('  Scaling annotation by', Math.round(scale * 100) / 100)

  return {
    ...map,
    resource: {
      ...map.resource,
      width,
      height
    },
    gcps: map.gcps.map(({ resource, geo }) => ({
      resource: [resource[0] / scale, resource[1] / scale],
      geo
    })),
    resourceMask: map.resourceMask.map((coordinate) => [
      Math.round(coordinate[0] / scale),
      Math.round(coordinate[1] / scale)
    ])
  }
}

// TODO: move to stdlib
export function createManifest(id, images) {
  return {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id,
    type: 'Manifest',
    items: images.map(({ imageId, width, height }) => ({
      id: `${imageId}/canvas`,
      type: 'Canvas',
      width,
      height,

      items: [
        {
          id: `${imageId}/annotation-page`,
          type: 'AnnotationPage',
          items: [
            {
              id: `${imageId}/annotation`,
              type: 'Annotation',
              motivation: 'painting',
              target: `${imageId}/canvas`,
              body: {
                id: `${imageId}/full/600,/0/default.jpg`,
                type: 'Image',
                format: 'image/jpg',
                width,
                height,
                service: [
                  {
                    '@id': imageId,
                    '@type': 'ImageService2',
                    profile: 'http://iiif.io/api/image/2/level0.json'
                  }
                ]
              }
            }
          ]
        }
      ]
    }))
  }
}
