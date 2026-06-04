export function debounce(fn, wait) {
  let timer;
  return function debounced() {
    clearTimeout(timer);
    const args = arguments;
    timer = setTimeout(function () {
      fn.apply(null, args);
    }, wait);
  };
}
