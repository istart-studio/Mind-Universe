/**
 * 3D文章宇宙渲染器
 * 纯前端版本 - 使用最新Three.js API
 */

// ES模块导入
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

// 全局变量
var camera, scene, renderer, cssRenderer;
var controls;
var objects = [];
var planets3D = []; // 存储3D星球对象
var planetLabels = []; // 存储星球标签HTML元素
var currentView = 'universe'; // universe, planet, article
var currentPlanet = null;
var currentArticle = null;

// 鼠标交互相关
var raycaster, mouse;
var hoveredPlanet = null;
var planetRotationSpeed = {}; // 存储每个星球的旋转速度

// 布局目标位置
var targets = {
    universe: [],   // 宇宙星球布局
    planet: [],     // 单个星球的文章球体布局
    article: []     // 文章详情布局
};

// 数据缓存
var planetsData = [];
var currentPlanetArticles = [];

// 3D材质库
var planetMaterials = [];
var starField = null;

// 加载进度
var loadingProgress = 0;
var totalLoadingSteps = 0;

// 初始化
init();
animate();

/**
 * 初始化3D场景
 */
function init() {
    // 添加CSS动画样式
    addAnimationStyles();
    
    // 创建加载进度条
    createLoadingBar();
    
    // 设置透视投影相机
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 2000; // 调整相机位置，更近观看星球

    // 创建场景
    scene = new THREE.Scene();

    // 鼠标交互初始化
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 添加光源 - 更亮的配置
    var ambientLight = new THREE.AmbientLight(0x404040, 1.0); // 环境光强度增加
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // 主光源更亮
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    var directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0); // 补光
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    var pointLight = new THREE.PointLight(0xffffff, 0.8, 0); // 点光源
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x0a0a2e); // 深蓝色背景，不是纯黑

    // 创建CSS3D渲染器
    cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = 0;

    // 绑定到容器
    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);
    container.appendChild(cssRenderer.domElement);

    // 轨道控制器
    controls = new TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.dynamicDampingFactor = 0.3;

    // 事件监听
    document.addEventListener('click', onMouseClick, false);
    document.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    // 创建背景星空
    createStarField();
    
    // 初始化材质库
    initPlanetMaterials();
    
    // 开始加载数据
    loadUniverseData();
}

/**
 * 添加CSS动画样式
 */
function addAnimationStyles() {
    var style = document.createElement('style');
    style.textContent = `
        @keyframes labelGlow {
            0% { 
                box-shadow: 0 0 40px rgba(0, 229, 255, 0.9), 
                           inset 0 0 25px rgba(0, 229, 255, 0.3),
                           0 0 80px rgba(255, 255, 255, 0.4);
                text-shadow: 0 0 15px #00e5ff, 0 0 30px #00e5ff, 0 0 45px #ffffff;
            }
            100% { 
                box-shadow: 0 0 60px rgba(0, 229, 255, 1.0), 
                           inset 0 0 35px rgba(0, 229, 255, 0.5),
                           0 0 120px rgba(255, 255, 255, 0.6);
                text-shadow: 0 0 20px #00e5ff, 0 0 40px #00e5ff, 0 0 60px #ffffff;
            }
        }
        
        @keyframes planetPulse {
            0% { 
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
                transform: scale(1);
            }
            50% { 
                box-shadow: 0 0 40px rgba(255, 255, 255, 0.8);
                transform: scale(1.05);
            }
            100% { 
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * 创建加载进度条
 */
function createLoadingBar() {
    var loadingHTML = `
        <div id="loading-container" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0a0a2e, #16213e);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: 'Microsoft YaHei', sans-serif;
        ">
            <div style="
                background: rgba(255,255,255,0.1);
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            ">
                <h1 style="
                    color: #64b5f6;
                    margin: 0 0 30px 0;
                    font-size: 2.5em;
                    text-shadow: 0 0 20px #64b5f6;
                ">🌌 文章宇宙</h1>
                
                <div id="loading-progress-bar" style="
                    width: 300px;
                    height: 8px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 20px 0;
                ">
                    <div id="loading-progress-fill" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, #64b5f6, #42a5f5);
                        border-radius: 4px;
                        transition: width 0.3s ease;
                    "></div>
                </div>
                
                <div id="loading-text" style="
                    color: #90caf9;
                    font-size: 1.1em;
                    margin-top: 15px;
                ">正在初始化...</div>
                
                <div id="loading-percentage" style="
                    color: #bbdefb;
                    font-size: 0.9em;
                    margin-top: 10px;
                ">0%</div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
}

/**
 * 更新加载进度
 */
function updateLoadingProgress(text, progress) {
    var loadingText = document.getElementById('loading-text');
    var progressFill = document.getElementById('loading-progress-fill');
    var progressPercentage = document.getElementById('loading-percentage');
    
    if (loadingText) loadingText.textContent = text;
    
    if (typeof progress === 'number') {
        loadingProgress = progress;
    } else {
        loadingProgress += 20; // 每步增加20%
    }
    
    loadingProgress = Math.min(loadingProgress, 100);
    
    if (progressFill) progressFill.style.width = loadingProgress + '%';
    if (progressPercentage) progressPercentage.textContent = Math.round(loadingProgress) + '%';
    
    // 加载完成后隐藏进度条
    if (loadingProgress >= 100) {
        setTimeout(function() {
            var loadingContainer = document.getElementById('loading-container');
            if (loadingContainer) {
                loadingContainer.style.transition = 'opacity 1s ease';
                loadingContainer.style.opacity = '0';
                setTimeout(function() {
                    loadingContainer.remove();
                }, 1000);
            }
        }, 500);
    }
}

/**
 * 创建星空背景（使用新版本API）
 */
function createStarField() {
    var starsGeometry = new THREE.BufferGeometry();
    var starCount = 2000;
    var positions = new Float32Array(starCount * 3);

    for (var i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 20000;     // x
        positions[i + 1] = (Math.random() - 0.5) * 20000; // y
        positions[i + 2] = (Math.random() - 0.5) * 20000; // z
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var starsMaterial = new THREE.PointsMaterial({
        color: 0x9999ff,
        size: 2,
        transparent: true,
        opacity: 0.8
    });

    starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}

/**
 * 初始化星球材质
 */
function initPlanetMaterials() {
    var colors = [
        0x44aa88, // 青绿色
        0x8844aa, // 紫色  
        0xaa4488, // 玫红色
        0x88aa44, // 黄绿色
        0x4488aa, // 蓝色
        0xaa8844  // 橙色
    ];

    colors.forEach(function(color) {
        var material = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 30,
            transparent: true,
            opacity: 0.9
        });
        planetMaterials.push(material);
    });
}

/**
 * 加载宇宙数据（所有星球）
 */
function loadUniverseData() {
    updateLoadingProgress('正在加载宇宙数据...', 30);
    
    fetch('data/planets.json')
        .then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            return response.text(); // 先获取文本
        })
        .then(function(text) {
            updateLoadingProgress('正在解析数据...', 50);
            // 确保正确解析UTF-8编码的JSON
            var data = JSON.parse(text);
            if (data.success) {
                planetsData = data.data;
                updateLoadingProgress('发现 ' + data.totalPlanets + ' 个星球，共 ' + data.totalArticles + ' 篇文章', 70);
                setTimeout(function() {
                    createUniverseView();
                }, 500);
            } else {
                throw new Error('数据格式错误');
            }
        })
        .catch(function(error) {
            console.error('加载星球数据失败:', error);
            updateInfo('❌ 数据加载失败！请确保已运行构建脚本生成数据文件。<br/>运行命令: <code>node build-data.js</code>');
            // 隐藏加载界面
            var loadingContainer = document.getElementById('loading-container');
            if (loadingContainer) loadingContainer.remove();
        });
}

/**
 * 创建宇宙视图（显示所有3D星球）
 */
function createUniverseView() {
    updateLoadingProgress('创建3D星球...', 80);
    
    // 清空现有对象
    clearScene();
    
    // 使用数据文件中的预设位置，如果没有则使用改进的分布算法
    var planetCount = planetsData.length;
    
    planetsData.forEach(function(planet, index) {
        // 创建3D星球对象
        var object = create3DPlanet(planet, index);
        
        // 设置随机初始位置，避免堆积
        object.position.x = Math.random() * 4000 - 2000;
        object.position.y = Math.random() * 4000 - 2000;
        object.position.z = Math.random() * 4000 - 2000;
        
        scene.add(object); // 添加到场景中！
        objects.push(object);
        planets3D.push(object);
        
        console.log('创建星球:', planet.name, '初始位置:', object.position, '添加到场景: ✓');
        
        var target = new THREE.Object3D();
        
        // 使用改进的分布算法，以窗口中心为基点分布
        var radius = 600; // 固定合适的半径，确保所有星球都能看到
        var angle = (index / planetCount) * Math.PI * 2;
        var heightVariation = (Math.random() - 0.5) * 200; // 较小的高度变化
        
        // 以原点(0,0,0)为中心分布，这就是窗口中心
        target.position.x = Math.cos(angle) * radius;
        target.position.y = Math.sin(angle) * radius * 0.8 + heightVariation; // 椭圆形分布
        target.position.z = -500 + (Math.random() - 0.5) * 300; // 距离相机更近
        
        targets.universe.push(target);
        
        console.log('星球', planet.name, '目标位置:', target.position);
        
        // 创建星球标签
        createPlanetLabel(planet, index);
    });
    
    // 设置当前视图并执行动画
    currentView = 'universe';
    transform(targets.universe, 3000);
    
    updateLoadingProgress('宇宙创建完成！', 100);
    
    // 确保标签在动画完成后显示
    setTimeout(function() {
        updatePlanetLabels();
        console.log('星球标签已更新，当前标签数量:', planetLabels.length);
        console.log('当前星球数量:', planets3D.length);
        
        // 调试：输出所有星球的最终位置
        planets3D.forEach(function(planet, index) {
            console.log('星球', index, '最终位置:', planet.position);
        });
        console.log('相机位置:', camera.position);
    }, 3500);
    
    // 更新UI信息
    setTimeout(function() {
        updateInfo('🌌 探索文章宇宙 - 点击星球进入，悬停查看效果');
    }, 1000);
}

/**
 * 创建星球HTML标签 - 改进样式
 */
function createPlanetLabel(planet, index) {
    var label = document.createElement('div');
    label.className = 'planet-label';
    label.style.cssText = `
        position: fixed;
        color: #ffffff;
        font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
        font-size: 20px;
        font-weight: bold;
        text-align: center;
        background: linear-gradient(135deg, rgba(15,15,25,0.95), rgba(35,35,55,0.95));
        padding: 14px 28px;
        border-radius: 35px;
        border: 4px solid #00e5ff;
        pointer-events: none;
        text-shadow: 0 0 20px #00e5ff, 0 0 40px #00e5ff, 0 0 60px #ffffff;
        box-shadow: 0 0 50px rgba(0, 229, 255, 1.0), 
                   inset 0 0 30px rgba(0, 229, 255, 0.4),
                   0 0 100px rgba(255, 255, 255, 0.5);
        white-space: nowrap;
        z-index: 1000;
        display: none;
        transform: translate(-50%, -50%);
        backdrop-filter: blur(20px);
        letter-spacing: 2px;
        animation: labelGlow 4s ease-in-out infinite alternate;
    `;
    
    label.textContent = planet.name + ' (' + planet.articleCount + ')';
    label.setAttribute('data-planet-index', index);
    
    document.body.appendChild(label);
    planetLabels.push(label);
    
    console.log('创建星球标签:', planet.name, '索引:', index);
}

/**
 * 更新星球标签位置
 */
function updatePlanetLabels() {
    if (currentView !== 'universe' || planetLabels.length === 0) return;
    
    planetLabels.forEach(function(label, index) {
        if (planets3D[index]) {
            var planet = planets3D[index];
            var vector = new THREE.Vector3();
            
            // 获取星球在屏幕上的位置
            planet.getWorldPosition(vector);
            vector.project(camera);
            
            // 转换为屏幕坐标
            var x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            var y = (vector.y * -0.5 + 0.5) * window.innerHeight;
            
            // 检查是否在屏幕范围内且在相机前方
            if (vector.z < 1 && x > -200 && x < window.innerWidth + 200) {
                label.style.left = x + 'px';
                label.style.top = (y - 100) + 'px'; // 星球上方
                label.style.display = 'block';
                
                // 距离越近，透明度越高
                var opacity = Math.max(0.3, Math.min(1, 1.5 - vector.z));
                label.style.opacity = opacity;
                
                // 悬停时高亮
                if (hoveredPlanet === planet) {
                    label.style.transform = 'translate(-50%, -50%) scale(1.1)';
                    label.style.animationDuration = '1s';
                } else {
                    label.style.transform = 'translate(-50%, -50%) scale(1)';
                    label.style.animationDuration = '4s';
                }
            } else {
                label.style.display = 'none';
            }
        }
    });
}

/**
 * 清除星球标签
 */
function clearPlanetLabels() {
    planetLabels.forEach(function(label) {
        if (label.parentNode) {
            label.parentNode.removeChild(label);
        }
    });
    planetLabels = [];
}

/**
 * 创建3D星球对象
 */
function create3DPlanet(planet, index) {
    var group = new THREE.Object3D();
    
    // 主星球 - 增大尺寸
    var geometry = new THREE.SphereGeometry(120, 32, 32);
    var material = planetMaterials[index % planetMaterials.length].clone();
    var sphere = new THREE.Mesh(geometry, material);
    
    // 为每个星球初始化旋转速度
    planetRotationSpeed[index] = {
        x: 0.001 + Math.random() * 0.002,
        y: 0.002 + Math.random() * 0.003,
        normal: true // 标记正常状态
    };
    
    group.add(sphere);
    
    // 添加发光环 - 调整尺寸
    var ringGeometry = new THREE.RingGeometry(140, 160, 32);
    var ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x64b5f6,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    var ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    
    // 存储引用以便后续操作
    group.userData = {
        planet: planet,
        index: index,
        sphere: sphere,
        ring: ring,
        originalMaterial: material.clone()
    };
    
    return group;
}

/**
 * 鼠标点击事件处理
 */
function onMouseClick(event) {
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    if (currentView === 'universe') {
        // 检测星球点击
        var intersects = raycaster.intersectObjects(planets3D, true);
        if (intersects.length > 0) {
            var obj = intersects[0].object;
            while (obj.parent && !obj.userData.planet) {
                obj = obj.parent;
            }
            if (obj.userData && obj.userData.planet) {
                enterPlanet(obj.userData.planet);
            }
        }
    } else if (currentView === 'planet') {
        // 检测文章点击
        var intersects = raycaster.intersectObjects(objects, true);
        if (intersects.length > 0) {
            var obj = intersects[0].object;
            if (obj.userData && obj.userData.article) {
                viewArticle(obj.userData.article);
            }
        }
    }
}

/**
 * 进入星球（显示文章球体）
 */
function enterPlanet(planet) {
    currentPlanet = planet;
    
    // 隐藏星球标签
    clearPlanetLabels();
    
    // 显示加载状态
    updateInfo('正在加载 ' + planet.name + ' 的文章...');
    
    // 获取星球的文章数据
    var articleUrl = 'data/articles/' + encodeURIComponent(planet.id) + '.json';
    console.log('正在加载文章数据，URL:', articleUrl);
    console.log('星球ID:', planet.id);
    
    fetch(articleUrl)
        .then(function(response) {
            console.log('响应状态:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            return response.text(); // 确保正确处理UTF-8编码
        })
        .then(function(text) {
            console.log('获取到文章数据，长度:', text.length);
            var data = JSON.parse(text);
            console.log('解析文章数据成功，文章数量:', data.articles ? data.articles.length : 0);
            currentPlanetArticles = data.articles || [];
            createPlanetView();
        })
        .catch(function(error) {
            console.error('加载文章数据失败:', error);
            console.error('请求URL:', articleUrl);
            updateInfo('❌ 加载星球文章失败: ' + error.message + '<br/>请求URL: ' + articleUrl + '<br/><button onclick="backToUniverse()">返回宇宙</button>');
        });
}

/**
 * 创建星球视图（文章球体）
 */
function createPlanetView() {
    console.log('开始创建星球视图，文章数量:', currentPlanetArticles.length);
    
    // 清除现有对象
    clearScene();
    targets.planet = [];
    
    if (!currentPlanetArticles || currentPlanetArticles.length === 0) {
        updateInfo('❌ 该星球暂无文章内容 | <button onclick="backToUniverse()">返回宇宙</button>');
        return;
    }
    
    // 计算需要的总卡片数量以形成完整球面
    var minCards = 24; // 最少24个卡片形成球面
    var totalCards = Math.max(currentPlanetArticles.length, minCards);
    var decorativeCards = totalCards - currentPlanetArticles.length;
    
    // 创建所有卡片（真实文章 + 装饰卡片）
    var allItems = [];
    
    // 添加真实文章
    currentPlanetArticles.forEach(function(article) {
        allItems.push({ type: 'article', data: article });
    });
    
    // 添加装饰卡片
    var decorativeColors = [
        'rgba(0,127,255,0.3)',    // 蓝色
        'rgba(0,255,127,0.3)',    // 绿色  
        'rgba(255,127,0,0.3)',    // 橙色
        'rgba(127,0,255,0.3)',    // 紫色
        'rgba(255,255,0,0.3)',    // 黄色
        'rgba(0,255,255,0.3)',    // 青色
    ];
    
    for (var i = 0; i < decorativeCards; i++) {
        allItems.push({ 
            type: 'decorative', 
            color: decorativeColors[i % decorativeColors.length],
            symbol: ['✦', '✧', '✩', '✪', '✫', '✬', '✭', '✮', '✯', '✰'][i % 10]
        });
    }
    
    console.log('总计卡片数量:', allItems.length, '(文章:', currentPlanetArticles.length, '装饰:', decorativeCards, ')');
    
    // 创建所有卡片
    allItems.forEach(function(item, index) {
        var element, object;
        
        if (item.type === 'article') {
            // 创建文章卡片
            console.log('创建文章元素:', item.data.title);
            element = createArticleElement(item.data);
            object = new CSS3DObject(element);
            
            // 添加用户数据
            object.userData = { article: item.data, type: 'article' };
            
            // 添加点击事件
            element.addEventListener('click', function(e) {
                console.log('文章点击事件触发:', item.data.title);
                e.stopPropagation();
                e.preventDefault();
                viewArticle(item.data);
            });
            
            // 添加悬停效果
            element.addEventListener('mouseenter', function() {
                element.classList.add('article-hover');
            });
            
            element.addEventListener('mouseleave', function() {
                element.classList.remove('article-hover');
            });
        } else {
            // 创建装饰卡片
            element = createDecorativeElement(item.color, item.symbol);
            object = new CSS3DObject(element);
            
            // 添加用户数据
            object.userData = { type: 'decorative' };
        }
        
        // 设置随机初始位置（远离相机）
        object.position.x = Math.random() * 4000 - 2000;
        object.position.y = Math.random() * 4000 - 2000;
        object.position.z = Math.random() * 2000 - 3000;
        
        scene.add(object);
        objects.push(object);
        
        // 球面分布计算
        var target = new THREE.Object3D();
        var radius = 800;
        
        // 使用黄金螺旋分布
        var goldenAngle = Math.PI * (3 - Math.sqrt(5));
        
        var y = 1 - (index / (allItems.length - 1)) * 2; // y从1到-1
        var radiusAtY = Math.sqrt(1 - y * y);
        var theta = goldenAngle * index;
        
        var x = Math.cos(theta) * radiusAtY;
        var z = Math.sin(theta) * radiusAtY;
        
        // 应用半径
        target.position.x = x * radius;
        target.position.y = y * radius;
        target.position.z = z * radius;
        
        // 让卡片朝向球心
        target.lookAt(new THREE.Vector3(0, 0, 0));
        
        targets.planet.push(target);
    });
    
    console.log('球面构建完成！');
    console.log('- 总卡片数:', objects.length);
    console.log('- 文章卡片:', currentPlanetArticles.length);
    console.log('- 装饰卡片:', decorativeCards);
    console.log('- 目标位置:', targets.planet.length);
    
    // 设置当前视图并执行动画
    currentView = 'planet';
    
    // 调整相机位置以更好地查看球面排列的文章
    new TWEEN.Tween(camera.position)
        .to({ x: 0, y: 0, z: 1200 }, 2000) // 适当距离观察球面
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();
    
    // 调试信息
    console.log('开始球面变换动画，targets数量:', targets.planet.length);
    console.log('TWEEN可用:', typeof TWEEN !== 'undefined');
    
    transform(targets.planet, 2000);
    
    // 更新UI信息
    var infoText = '🪐 ' + currentPlanet.name + ' - ' + currentPlanetArticles.length + ' 篇文章';
    if (decorativeCards > 0) {
        infoText += ' + ' + decorativeCards + ' 个装饰球面';
    }
    infoText += ' | 点击文章卡片查看详情 | <button onclick="backToUniverse()">返回宇宙</button>';
    updateInfo(infoText);
}

/**
 * 创建文章HTML元素
 */
function createArticleElement(article) {
    var element = document.createElement('div');
    element.className = 'article-element';
    element.style.backgroundColor = 'rgba(127,0,127,' + (Math.random() * 0.5 + 0.25) + ')';
    
    // 文章标题
    var title = document.createElement('div');
    title.className = 'article-title';
    title.textContent = article.title;
    element.appendChild(title);
    
    // 文章目录
    var directory = document.createElement('div');
    directory.className = 'article-directory';
    directory.textContent = article.directory;
    element.appendChild(directory);
    
    return element;
}

/**
 * 创建装饰性HTML元素
 */
function createDecorativeElement(color, symbol) {
    var element = document.createElement('div');
    element.className = 'decorative-element';
    element.style.backgroundColor = color;
    element.style.border = '1px solid ' + color.replace('0.3', '0.6');
    element.style.boxShadow = '0px 0px 8px ' + color.replace('0.3', '0.4');
    
    // 装饰符号
    var symbolDiv = document.createElement('div');
    symbolDiv.className = 'decorative-symbol';
    symbolDiv.textContent = symbol;
    symbolDiv.style.fontSize = '40px';
    symbolDiv.style.color = color.replace('0.3', '0.8');
    symbolDiv.style.textAlign = 'center';
    symbolDiv.style.lineHeight = '100px';
    symbolDiv.style.textShadow = '0 0 10px ' + color.replace('0.3', '0.9');
    element.appendChild(symbolDiv);
    
    return element;
}

/**
 * 查看文章详情
 */
function viewArticle(article) {
    currentArticle = article;
    
    updateInfo('正在加载文章内容...');
    
    // 直接使用文章数据中的内容
    showArticleDetail(article);
}

/**
 * 显示文章详情
 */
function showArticleDetail(articleData) {
    // 隐藏3D场景
    renderer.domElement.style.display = 'none';
    cssRenderer.domElement.style.display = 'none';
    
    // 创建文章详情视图
    var detailView = document.createElement('div');
    detailView.className = 'article-detail-view';
    detailView.id = 'article-detail';
    
    // 文章头部
    var header = document.createElement('div');
    header.className = 'article-header';
    
    var title = document.createElement('h1');
    title.textContent = articleData.title;
    header.appendChild(title);
    
    var meta = document.createElement('div');
    meta.className = 'article-meta';
    meta.innerHTML = '<span>星球: ' + currentPlanet.name + '</span>' +
                     '<span>目录: ' + articleData.directory + '</span>' +
                     '<span>文件: ' + articleData.filename + '</span>';
    header.appendChild(meta);
    
    var actions = document.createElement('div');
    actions.className = 'article-actions';
    actions.innerHTML = '<button onclick="backToPlanet()">返回星球</button>' +
                       '<button onclick="backToUniverse()">返回宇宙</button>';
    header.appendChild(actions);
    
    detailView.appendChild(header);
    
    // 文章内容
    var content = document.createElement('div');
    content.className = 'article-content';
    
    // 简单的AsciiDoc渲染
    var htmlContent = articleData.content
        .replace(/^=+ (.+)$/gm, '<h2>$1</h2>')
        .replace(/^\* (.+)$/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gm, '<p>$1</p>')
        .replace(/<p><li>/g, '<ul><li>')
        .replace(/<\/li><\/p>/g, '</li></ul>');
    
    content.innerHTML = htmlContent;
    detailView.appendChild(content);
    
    document.body.appendChild(detailView);
    
    // 更新信息
    updateInfo('📖 正在阅读: ' + articleData.title);
}

/**
 * 返回星球视图
 */
function backToPlanet() {
    var detailView = document.getElementById('article-detail');
    if (detailView) {
        document.body.removeChild(detailView);
    }
    
    // 显示3D场景
    renderer.domElement.style.display = 'block';
    cssRenderer.domElement.style.display = 'block';
    
    // 恢复星球视图
    currentView = 'planet';
    updateInfo('🪐 ' + currentPlanet.name + ' - ' + currentPlanetArticles.length + ' 篇文章 | 点击文章查看详情 | <button onclick="backToUniverse()">返回宇宙</button>');
}

/**
 * 返回宇宙视图
 */
function backToUniverse() {
    var detailView = document.getElementById('article-detail');
    if (detailView) {
        document.body.removeChild(detailView);
    }
    
    // 显示3D场景
    renderer.domElement.style.display = 'block';
    cssRenderer.domElement.style.display = 'block';
    
    currentPlanet = null;
    currentArticle = null;
    currentPlanetArticles = [];
    
    createUniverseView();
}

/**
 * 清除场景中的对象
 */
function clearScene() {
    while (objects.length > 0) {
        var object = objects.pop();
        scene.remove(object);
    }
}

/**
 * 执行3D变换动画
 */
function transform(targets, duration) {
    console.log('Transform开始执行，objects数量:', objects.length, 'targets数量:', targets.length);
    
    if (!targets || targets.length === 0) {
        console.error('targets数组为空或未定义');
        return;
    }
    
    if (objects.length !== targets.length) {
        console.error('objects和targets数量不匹配:', objects.length, targets.length);
        return;
    }
    
    TWEEN.removeAll();
    
    for (var i = 0; i < objects.length; i++) {
        var object = objects[i];
        var target = targets[i];
        
        if (!target || !target.position) {
            console.error('target', i, '无效:', target);
            continue;
        }
        
        console.log('对象', i, '从', 
            {x: object.position.x, y: object.position.y, z: object.position.z},
            '移动到',
            {x: target.position.x, y: target.position.y, z: target.position.z}
        );
        
        var tween = new TWEEN.Tween(object.position)
            .to({
                x: target.position.x,
                y: target.position.y,
                z: target.position.z
            }, duration + Math.random() * 1000) // 统一基础时间，减少随机性
            .easing(TWEEN.Easing.Exponential.InOut)
            .onStart(function() {
                console.log('动画开始 - 对象', i);
            })
            .onUpdate(function() {
                // 每隔一段时间输出位置信息
                if (Math.random() < 0.01) { // 1% 概率输出，避免过多日志
                    console.log('对象', i, '当前位置:', {x: object.position.x, y: object.position.y, z: object.position.z});
                }
            })
            .onComplete(function() {
                console.log('动画完成 - 对象', i, '最终位置:', {x: object.position.x, y: object.position.y, z: object.position.z});
            })
            .start();
            
        console.log('TWEEN', i, '已启动:', tween);
        
        new TWEEN.Tween(object.rotation)
            .to({
                x: target.rotation.x,
                y: target.rotation.y,
                z: target.rotation.z
            }, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
    }
    
    new TWEEN.Tween(this)
        .to({}, duration * 2)
        .onUpdate(render)
        .onComplete(function() {
            console.log('主动画序列完成');
        })
        .start();
        
    // 备用方案：如果TWEEN没有工作，3秒后直接设置位置
    setTimeout(function() {
        console.log('执行备用方案 - 直接设置位置');
        for (var i = 0; i < objects.length; i++) {
            if (targets[i] && targets[i].position) {
                objects[i].position.copy(targets[i].position);
                objects[i].rotation.copy(targets[i].rotation);
                console.log('直接设置对象', i, '到位置:', targets[i].position);
            }
        }
        render(); // 强制渲染
    }, 5000);
}

/**
 * 更新信息显示
 */
function updateInfo(text) {
    var info = document.getElementById('info');
    if (info) {
        info.innerHTML = text;
    }
}

/**
 * HTML转义
 */
function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * 窗口大小变化处理
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

/**
 * 鼠标移动事件 - 用于悬停检测
 */
function onMouseMove(event) {
    if (currentView !== 'universe') return;
    
    // 计算鼠标位置
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // 射线检测
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(planets3D, true);
    
    // 重置之前悬停的星球
    if (hoveredPlanet && intersects.length === 0) {
        resetPlanetHover(hoveredPlanet);
        hoveredPlanet = null;
    }
    
    // 设置新的悬停星球
    if (intersects.length > 0) {
        var newHovered = intersects[0].object.parent;
        if (newHovered !== hoveredPlanet) {
            if (hoveredPlanet) {
                resetPlanetHover(hoveredPlanet);
            }
            hoveredPlanet = newHovered;
            setPlanetHover(hoveredPlanet);
        }
    }
}

/**
 * 设置星球悬停效果
 */
function setPlanetHover(planetGroup) {
    if (!planetGroup.userData) return;
    
    var index = planetGroup.userData.index;
    var sphere = planetGroup.userData.sphere;
    var ring = planetGroup.userData.ring;
    
    // 增加旋转速度
    planetRotationSpeed[index].x *= 3;
    planetRotationSpeed[index].y *= 3;
    planetRotationSpeed[index].normal = false;
    
    // 高亮材质
    sphere.material.emissive.setHex(0x223366);
    sphere.material.emissiveIntensity = 0.3;
    
    // 高亮环
    ring.material.opacity = 0.8;
    ring.material.color.setHex(0x00e5ff);
    
    // 改变鼠标样式
    document.body.style.cursor = 'pointer';
}

/**
 * 重置星球悬停效果
 */
function resetPlanetHover(planetGroup) {
    if (!planetGroup.userData) return;
    
    var index = planetGroup.userData.index;
    var sphere = planetGroup.userData.sphere;
    var ring = planetGroup.userData.ring;
    
    // 恢复正常旋转速度
    planetRotationSpeed[index].x = 0.001 + Math.random() * 0.002;
    planetRotationSpeed[index].y = 0.002 + Math.random() * 0.003;
    planetRotationSpeed[index].normal = true;
    
    // 恢复原材质
    sphere.material.emissive.setHex(0x000000);
    sphere.material.emissiveIntensity = 0;
    
    // 恢复原环
    ring.material.opacity = 0.3;
    ring.material.color.setHex(0x64b5f6);
    
    // 恢复鼠标样式
    document.body.style.cursor = 'default';
}

/**
 * 动画循环
 */
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    
    // 更新星球标签位置（更频繁地调用）
    if (currentView === 'universe') {
        updatePlanetLabels();
        
        // 更新星球自转
        planets3D.forEach(function(planetGroup, index) {
            if (planetGroup.userData && planetGroup.userData.sphere) {
                var speed = planetRotationSpeed[index];
                if (speed) {
                    planetGroup.userData.sphere.rotation.x += speed.x;
                    planetGroup.userData.sphere.rotation.y += speed.y;
                }
            }
        });
    }
    
    render(); // 渲染场景
}

/**
 * 渲染场景
 */
function render() {
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera); // 渲染CSS3D对象
} 