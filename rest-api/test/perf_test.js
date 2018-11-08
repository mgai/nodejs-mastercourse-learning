const { performance, PerformanceObserver } = require('perf_hooks');
const obs = new PerformanceObserver((list, obs) => {
    list.getEntries().forEach(e => console.dir(e));
    obs.disconnect();
});

obs.observe({entryTypes: ['measure'], buffered: true});

performance.mark('start');
for(let i=0; i<10000; i++)
    for(let j=0; j<10000; j++);
performance.mark('loop-done');
performance.measure('looping time', 'start', 'loop-done');
setTimeout(_ => {performance.mark('end'); performance.measure('full', 'start', 'end');}, 1000)




