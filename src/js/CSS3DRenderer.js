// Based on http://www.emagix.net/academic/mscs-project/item/camera-sync-with-css3-and-webgl-threejs
// Adapted for global script loading

const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();

/**
 * The base 3D object that is supported by {@link CSS3DRenderer}.
 */
THREE.CSS3DObject = class extends THREE.Object3D {

	constructor( element = document.createElement( 'div' ) ) {

		super();

		this.isCSS3DObject = true;

		this.element = element;
		this.element.style.position = 'absolute';
		this.element.style.pointerEvents = 'auto';
		this.element.style.userSelect = 'none';

		this.element.setAttribute( 'draggable', false );

		this.addEventListener( 'removed', function () {

			this.traverse( function ( child ) {

				if ( child.element !== undefined && child.element.parentNode !== null ) {

					child.element.parentNode.removeChild( child.element );

				}

			} );

		} );

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.element = source.element.cloneNode( true );

		return this;

	}

};

/**
 * A 3D sprite that is associated with a specific DOM element. The sprite's 2D coordinate system is defined as:
 * - x-axis: rightward
 * - y-axis: downward
 *
 * This means the origin (0, 0) represents the top-left corner.
 */
THREE.CSS3DSprite = class extends THREE.CSS3DObject {

	constructor( element ) {

		super( element );

		this.isCSS3DSprite = true;

		this.rotation2D = 0;

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.rotation2D = source.rotation2D;

		return this;

	}

};

//

const _matrix = new THREE.Matrix4();
const _matrix2 = new THREE.Matrix4();

/**
 * A renderer for CSS3D content.
 *
 * The purpose of this renderer is to enable the easy integration of HTML content into a three.js scene.
 * When using this renderer, it's recommended to use {@link CSS3DObject} instead of {@link Object3D} in your scene graph.
 */
THREE.CSS3DRenderer = class {

	constructor( parameters = {} ) {

		const _this = this;

		let _width, _height;
		let _widthHalf, _heightHalf;

		const cache = {
			camera: { fov: 0, style: '' },
			objects: new WeakMap()
		};

		const domElement = parameters.element !== undefined ? parameters.element : document.createElement( 'div' );

		domElement.style.overflow = 'hidden';

		this.domElement = domElement;

		this.setSize = function ( width, height ) {

			_width = width;
			_height = height;
			_widthHalf = _width / 2;
			_heightHalf = _height / 2;

			domElement.style.width = width + 'px';
			domElement.style.height = height + 'px';

		};

		this.render = function ( scene, camera ) {

			const fov = camera.projectionMatrix.elements[ 5 ] * _heightHalf;

			if ( cache.camera.fov !== fov ) {

				if ( camera.isPerspectiveCamera ) {

					domElement.style.perspective = fov + 'px';

				} else {

					domElement.style.perspective = '';

				}

				cache.camera.fov = fov;

			}

			if ( scene.matrixWorldAutoUpdate === true ) scene.updateMatrixWorld();
			if ( camera.matrixWorldAutoUpdate === true ) camera.updateMatrixWorld();

			let tx, ty;

			if ( camera.isPerspectiveCamera ) {

				tx = _widthHalf;
				ty = _heightHalf;

			} else {

				tx = - ( camera.right + camera.left ) / 2;
				ty = ( camera.top + camera.bottom ) / 2;

			}

			const cameraCSSMatrix = camera.isOrthographicCamera ?
				'scale(' + fov + ')' +
				'translate(' + epsilon( tx ) + 'px,' + epsilon( ty ) + 'px)' +
				getCameraCSSMatrix( camera.matrixWorldInverse ) :
				'translateZ(' + fov + 'px)' +
				getCameraCSSMatrix( camera.matrixWorldInverse ) +
				'translate(' + _widthHalf + 'px,' + _heightHalf + 'px)';

			if ( cache.camera.style !== cameraCSSMatrix ) {

				domElement.style.transform = cameraCSSMatrix;

				cache.camera.style = cameraCSSMatrix;

			}

			renderObject( scene, scene, camera, cameraCSSMatrix );

		};

		function epsilon( value ) {

			return Math.abs( value ) < 1e-10 ? 0 : value;

		}

		function getCameraCSSMatrix( matrix ) {

			const elements = matrix.elements;

			return 'matrix3d(' +
				epsilon( elements[ 0 ] ) + ',' +
				epsilon( - elements[ 1 ] ) + ',' +
				epsilon( elements[ 2 ] ) + ',' +
				epsilon( elements[ 3 ] ) + ',' +
				epsilon( elements[ 4 ] ) + ',' +
				epsilon( - elements[ 5 ] ) + ',' +
				epsilon( elements[ 6 ] ) + ',' +
				epsilon( elements[ 7 ] ) + ',' +
				epsilon( elements[ 8 ] ) + ',' +
				epsilon( - elements[ 9 ] ) + ',' +
				epsilon( elements[ 10 ] ) + ',' +
				epsilon( elements[ 11 ] ) + ',' +
				epsilon( elements[ 12 ] ) + ',' +
				epsilon( - elements[ 13 ] ) + ',' +
				epsilon( elements[ 14 ] ) + ',' +
				epsilon( elements[ 15 ] ) +
			')';

		}

		function getObjectCSSMatrix( matrix ) {

			const elements = matrix.elements;
			const matrix3d = 'matrix3d(' +
				epsilon( elements[ 0 ] ) + ',' +
				epsilon( elements[ 1 ] ) + ',' +
				epsilon( elements[ 2 ] ) + ',' +
				epsilon( elements[ 3 ] ) + ',' +
				epsilon( - elements[ 4 ] ) + ',' +
				epsilon( - elements[ 5 ] ) + ',' +
				epsilon( - elements[ 6 ] ) + ',' +
				epsilon( - elements[ 7 ] ) + ',' +
				epsilon( elements[ 8 ] ) + ',' +
				epsilon( elements[ 9 ] ) + ',' +
				epsilon( elements[ 10 ] ) + ',' +
				epsilon( elements[ 11 ] ) + ',' +
				epsilon( elements[ 12 ] ) + ',' +
				epsilon( elements[ 13 ] ) + ',' +
				epsilon( elements[ 14 ] ) + ',' +
				epsilon( elements[ 15 ] ) +
			')';

			return 'translate(-50%,-50%)' + matrix3d;

		}

		function hideObject( object ) {

			if ( object.isCSS3DObject ) object.element.style.display = 'none';

			for ( let i = 0, l = object.children.length; i < l; i ++ ) {

				hideObject( object.children[ i ] );

			}

		}

		function renderObject( object, scene, camera, cameraCSSMatrix ) {

			if ( object.isCSS3DObject ) {

				const visible = ( object.visible === true ) && ( object.layers.test( camera.layers ) === true );
				object.element.style.display = ( visible === true ) ? '' : 'none';

				if ( visible === true ) {

					object.onBeforeRender( _this, scene, camera );

					let style;

					if ( object.isCSS3DSprite ) {

						// http://en.wikipedia.org/wiki/Billboard_(computer_graphics)

						_matrix.copy( camera.matrixWorldInverse );
						_matrix.transpose();

						if ( object.rotation2D !== 0 ) _matrix.multiply( _matrix2.makeRotationZ( object.rotation2D ) );

						object.matrixWorld.decompose( _position, _quaternion, _scale );
						_matrix.setPosition( _position );
						_matrix.scale( _scale );

						_matrix.elements[ 3 ] = 0;
						_matrix.elements[ 7 ] = 0;
						_matrix.elements[ 11 ] = 0;
						_matrix.elements[ 15 ] = 1;

						style = getObjectCSSMatrix( _matrix );

					} else {

						style = getObjectCSSMatrix( object.matrixWorld );

					}

					const element = object.element;
					const cachedObject = cache.objects.get( object );

					if ( cachedObject === undefined || cachedObject.style !== style ) {

						element.style.transform = style;

						const objectData = { style: style };

						cache.objects.set( object, objectData );

					}

					object.onAfterRender( _this, scene, camera );

				}

			}

			for ( let i = 0, l = object.children.length; i < l; i ++ ) {

				renderObject( object.children[ i ], scene, camera, cameraCSSMatrix );

			}

		}

	}

};
