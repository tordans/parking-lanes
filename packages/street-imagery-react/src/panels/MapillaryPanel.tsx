import { getStreetImageryConfig } from '@osm-editor-kit/street-imagery'
import type { NormalizedPhoto } from '@osm-editor-kit/street-imagery'
import 'mapillary-js/dist/mapillary.css'

import {
  Viewer,
  type ViewerBearingEvent,
  type ViewerImageEvent,
  type ViewerNavigableEvent,
} from 'mapillary-js'
import { useEffect, useRef } from 'react'
import type { StreetImageryPhotoSelection } from '../types'
import { useViewerActions } from '../useViewerStore'
type MapillaryPanelProps = {
  photo: NormalizedPhoto
  groupPhotos: NormalizedPhoto[]
  onPhotoSelected: (selection: StreetImageryPhotoSelection) => void
  onEaseMapToPoint: (lng: number, lat: number) => void
}

export const MapillaryPanel = ({
  photo,
  onPhotoSelected,
  onEaseMapToPoint,
}: MapillaryPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const navigableRef = useRef(false)
  const pendingImageIdRef = useRef<string | null>(null)
  const lastViewerPhotoIdRef = useRef<string | null>(null)
  const bearingRafRef = useRef<number | null>(null)
  const pendingBearingRef = useRef<number | null>(null)
  const actions = useViewerActions()
  const initialPhotoIdRef = useRef(photo.photoId)

  useEffect(
    function resetViewerStoreOnProviderChange() {
      return () => {
        actions.reset()
      }
    },
    [actions, photo.providerId],
  )

  useEffect(
    function mountMapillaryViewer() {
      const container = containerRef.current
      if (!container) {
        return
      }

      const viewer = new Viewer({
        accessToken: getStreetImageryConfig().mapillaryToken,
        container,
        imageId: initialPhotoIdRef.current,
        component: {
          cover: false,
          sequence: { visible: true },
        },
      })
      viewerRef.current = viewer
      lastViewerPhotoIdRef.current = initialPhotoIdRef.current

      const flushPendingMove = () => {
        const pendingId = pendingImageIdRef.current
        if (!pendingId) {
          return
        }
        pendingImageIdRef.current = null
        void viewer.moveTo(pendingId).catch(() => {})
      }

      const onNavigable = (event: ViewerNavigableEvent) => {
        navigableRef.current = event.navigable
        if (event.navigable) {
          flushPendingMove()
        }
      }

      const onImage = (event: ViewerImageEvent) => {
        const { image } = event
        lastViewerPhotoIdRef.current = image.id

        onPhotoSelected({
          provider: 'mapillary',
          sequenceId: image.sequenceId,
          photoId: image.id,
        })

        const position = image.lngLat ?? image.originalLngLat
        if (!position) {
          return
        }

        actions.setPov({ lngLat: [position.lng, position.lat] })
        onEaseMapToPoint(position.lng, position.lat)
      }

      const flushBearing = () => {
        bearingRafRef.current = null
        if (pendingBearingRef.current != null) {
          actions.setPov({ bearing: pendingBearingRef.current })
          pendingBearingRef.current = null
        }
        void viewer
          .getFieldOfView()
          .then((fov) => {
            actions.setPov({ hfov: fov })
          })
          .catch(() => {})
      }

      const onBearing = (event: ViewerBearingEvent) => {
        pendingBearingRef.current = event.bearing
        if (bearingRafRef.current == null) {
          bearingRafRef.current = requestAnimationFrame(flushBearing)
        }
      }

      viewer.on('navigable', onNavigable)
      viewer.on('image', onImage)
      viewer.on('bearing', onBearing)

      const resizeObserver = new ResizeObserver(() => {
        viewer.resize()
      })
      resizeObserver.observe(container)

      return () => {
        if (bearingRafRef.current != null) {
          cancelAnimationFrame(bearingRafRef.current)
          bearingRafRef.current = null
        }
        resizeObserver.disconnect()
        viewer.off('navigable', onNavigable)
        viewer.off('image', onImage)
        viewer.off('bearing', onBearing)
        viewer.remove()
        viewerRef.current = null
      }
    },
    [actions, onEaseMapToPoint, onPhotoSelected],
  )

  useEffect(
    function syncExternalPhotoSelection() {
      const viewer = viewerRef.current
      if (!viewer || photo.photoId === lastViewerPhotoIdRef.current) {
        return
      }

      actions.reset()

      lastViewerPhotoIdRef.current = photo.photoId

      if (navigableRef.current) {
        void viewer.moveTo(photo.photoId).catch(() => {})
      } else {
        pendingImageIdRef.current = photo.photoId
      }
    },
    [actions, photo.photoId],
  )

  return (
    <div
      ref={containerRef}
      className="min-h-48 overflow-hidden rounded-lg border border-slate-200 bg-slate-900"
      style={{ aspectRatio: '4 / 3' }}
    />
  )
}
