#!/usr/bin/env node

/**
 * 文档数据构建脚本
 * 扫描doc文件夹，生成前端需要的静态JSON数据文件
 */

const fs = require('fs');
const path = require('path');

/**
 * 构建静态数据文件
 * 扫描doc文件夹，生成planets.json和articles文件
 */

const DOC_DIR = 'doc';
const OUTPUT_DIR = 'src/data';
const ARTICLES_DIR = path.join(OUTPUT_DIR, 'articles');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
}

/**
 * 扫描目录获取所有星球（文件夹）
 */
function scanPlanets() {
    const planets = [];
    const items = fs.readdirSync(DOC_DIR, { encoding: 'utf8' });
    
    items.forEach(item => {
        const itemPath = path.join(DOC_DIR, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
            // 递归扫描子目录获取文章
            const articles = scanArticles(itemPath);
            
            if (articles.length > 0) {
                planets.push({
                    id: item,
                    name: item,
                    path: item,
                    articleCount: articles.length,
                    position: generatePlanetPosition(planets.length)
                });
                
                // 保存星球的文章数据
                saveArticleData(item, articles);
                console.log(`✓ 星球 "${item}": ${articles.length} 篇文章`);
            }
        }
    });
    
    return planets;
}

/**
 * 递归扫描文章文件
 */
function scanArticles(dirPath, relativePath = '') {
    const articles = [];
    
    try {
        const items = fs.readdirSync(dirPath, { encoding: 'utf8' });
        
        items.forEach(item => {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                // 递归扫描子目录
                const subPath = relativePath ? `${relativePath}/${item}` : item;
                const subArticles = scanArticles(itemPath, subPath);
                articles.push(...subArticles);
            } else if (item.endsWith('.adoc')) {
                // 读取文章文件
                const content = fs.readFileSync(itemPath, { encoding: 'utf8' });
                const title = extractTitle(content, item);
                const directory = relativePath || '/';
                
                articles.push({
                    title: title,
                    filename: item,
                    directory: directory,
                    path: relativePath ? `${relativePath}/${item}` : item,
                    content: content,
                    position: generateSpherePosition(articles.length)
                });
            }
        });
    } catch (error) {
        console.error(`扫描目录失败 ${dirPath}:`, error.message);
    }
    
    return articles;
}

/**
 * 从文章内容中提取标题
 */
function extractTitle(content, filename) {
    const lines = content.split('\n');
    
    // 查找第一个非空行作为标题
    for (let line of lines) {
        line = line.trim();
        if (line && !line.startsWith('//') && !line.startsWith(':')) {
            // 移除AsciiDoc标记
            return line.replace(/^=+\s*/, '').replace(/\s*=+$/, '').trim();
        }
    }
    
    // 如果没找到标题，使用文件名
    return filename.replace('.adoc', '').replace(/_/g, ' ');
}

/**
 * 生成星球在3D空间中的位置
 */
function generatePlanetPosition(index) {
    const radius = 3000;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 黄金角度
    
    const y = 1 - (index / (4 - 1)) * 2; // y在-1到1之间
    const radiusAtY = Math.sqrt(1 - y * y);
    
    const theta = goldenAngle * index;
    
    const x = Math.cos(theta) * radiusAtY * radius * 0.8;
    const z = Math.sin(theta) * radiusAtY * radius * 0.8 - radius;
    
    return {
        x: x,
        y: y * radius * 0.3,
        z: z
    };
}

/**
 * 生成文章在球面上的位置
 */
function generateSpherePosition(index) {
    const radius = 1800;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    const y = 1 - (index / 50) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    
    const theta = goldenAngle * index;
    
    const x = Math.cos(theta) * radiusAtY * radius;
    const z = Math.sin(theta) * radiusAtY * radius;
    
    return {
        x: x,
        y: y * radius,
        z: z
    };
}

/**
 * 保存星球的文章数据
 */
function saveArticleData(planetId, articles) {
    const filename = `${encodeURIComponent(planetId)}.json`;
    const filepath = path.join(ARTICLES_DIR, filename);
    
    const data = {
        planetId: planetId,
        planetName: planetId,
        articles: articles.map(article => ({
            title: article.title,
            filename: article.filename,
            directory: article.directory,
            path: article.path,
            position: article.position,
            content: article.content
        })),
        totalArticles: articles.length,
        generatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), { encoding: 'utf8' });
}

/**
 * 主函数
 */
function main() {
    console.log('🚀 开始构建文章宇宙数据...\n');
    
    if (!fs.existsSync(DOC_DIR)) {
        console.error(`❌ 文档目录不存在: ${DOC_DIR}`);
        process.exit(1);
    }
    
    // 扫描所有星球
    const planets = scanPlanets();
    
    if (planets.length === 0) {
        console.error('❌ 没有找到任何包含.adoc文件的文件夹');
        process.exit(1);
    }
    
    // 计算总文章数
    const totalArticles = planets.reduce((sum, planet) => sum + planet.articleCount, 0);
    
    // 生成星球数据文件
    const planetsData = {
        success: true,
        data: planets,
        generatedAt: new Date().toISOString(),
        totalPlanets: planets.length,
        totalArticles: totalArticles
    };
    
    const planetsFile = path.join(OUTPUT_DIR, 'planets.json');
    fs.writeFileSync(planetsFile, JSON.stringify(planetsData, null, 2), { encoding: 'utf8' });
    
    console.log(`\n✅ 构建完成！`);
    console.log(`📊 统计信息:`);
    console.log(`   - 星球数量: ${planets.length}`);
    console.log(`   - 文章总数: ${totalArticles}`);
    console.log(`   - 数据文件: ${planetsFile}`);
    console.log(`   - 文章目录: ${ARTICLES_DIR}`);
    console.log(`\n🌟 现在可以启动前端服务器了！`);
}

// 运行主函数
main(); 