export function isLocalhost (): boolean {
  const hostname = window.location.hostname
  const devHosts = ['localhost', '127.0.0.1']
  return devHosts.includes(hostname)
}
