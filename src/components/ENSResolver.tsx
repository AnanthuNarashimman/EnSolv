import { useState } from 'react'
import { ethers } from 'ethers'
import { http } from 'viem'
import { mainnet } from 'viem/chains'
import { createEnsPublicClient } from '@ensdomains/ensjs'

/**
 * ENSResolver component allows users to input an ENS name and resolve it to an Ethereum address.
 *
 * It leverages both ethers.js and @ensdomains/ensjs for name resolution:
 *  - ethers.js is used for a quick resolution via `provider.resolveName` as a primary method
 *  - @ensdomains/ensjs is used as a fallback to demonstrate usage of the library as required by the task
 */
const ENSResolver = () => {
  const [ensName, setEnsName] = useState('')
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const rpcUrl = import.meta.env.VITE_ETHEREUM_RPC_URL as string | undefined

  const onResolve = async () => {
    if (!ensName) return
    setLoading(true)
    setError(null)
    setResolvedAddress(null)

    try {
      if (!rpcUrl) {
        throw new Error('Ethereum RPC URL is not defined in environment variables')
      }

      // Primary resolution via ethers.js
      const provider = new ethers.JsonRpcProvider(rpcUrl)
      let address = await provider.resolveName(ensName)

      // If ethers fails to resolve, fall back to ENSJS
      if (!address) {
        const client = createEnsPublicClient({
          chain: mainnet,
          transport: http(rpcUrl),
        })
        // getAddressRecord returns an object {address} – we just need that field
        const addrRecord = await client.getAddressRecord({ name: ensName }) as { address?: string | null }
        address = addrRecord?.address ?? null
      }

      if (!address) {
        throw new Error('Could not resolve ENS name')
      }

      setResolvedAddress(address)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2>ENS Resolver</h2>
      <div style={styles.formRow}>
        <input
          type="text"
          placeholder="Enter ENS name (e.g. vitalik.eth)"
          value={ensName}
          onChange={(e) => setEnsName(e.target.value)}
          style={styles.input}
        />
        <button onClick={onResolve} style={styles.button} disabled={loading || !ensName}>
          {loading ? 'Resolving...' : 'Resolve ENS'}
        </button>
      </div>
      {resolvedAddress && (
        <p style={{ ...styles.result, color: 'green' }}>Resolved Address: {resolvedAddress}</p>
      )}
      {error && (
        <p style={{ ...styles.result, color: 'red' }}>Error: {error}</p>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '2rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    maxWidth: '400px',
    margin: '2rem auto',
  },
  formRow: {
    display: 'flex',
    width: '100%',
    gap: '0.5rem',
  },
  input: {
    flex: 1,
    padding: '0.5rem',
    fontSize: '1rem',
  },
  button: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  result: {
    wordBreak: 'break-all',
  },
}

export default ENSResolver