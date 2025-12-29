function getApiPrefixFromPathname(pathname) {
  var firstSegment = pathname.split('/')[1];
  if (!firstSegment || firstSegment === 'app') return '';
  return '/' + firstSegment;
}
