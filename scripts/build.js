//把package目录完全打包

const fs = require('fs');
const execa = require('execa'); // 开启子进程， 使用rollup打包

const targets = fs.readdirSync('packages').filter(f => {
  if (!fs.statSync(`packages/${f}`).isDirectory()) {
    return false
  }

  return true
})

// 对我们的目标依次进行打包， 并行打包

async function build(target) {
  // 运行rollup 打包
  await execa('rollup', ['-c', '--environment', `TARGET:${target}`], {
    stdio: 'inherit'
  });


}

function runParallel(targets, iteratorFn) {
  const res = [];

  for (const item of targets) {
    const p = iteratorFn(item);
    res.push(p);
  }

  return Promise.all(res);
}

runParallel(targets, build);