//  只针对某个包打包

const fs = require('fs');
const execa = require('execa'); // 开启子进程， 使用rollup打包

const targets = 'reactivity'

build(targets);

async function build(target) {
  // 运行rollup 打包
  await execa('rollup', ['-cw', '--environment', `TARGET:${target}`], {
    stdio: 'inherit'
  }); // 当前子进程打包的信息共享给父进程
}