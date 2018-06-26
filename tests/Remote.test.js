import Remote from '../src/Remote'
import ssh from 'ssh2'

describe('Remote#connect', () => {
  it('Connects and emmit the ready event if successfull', () => {
    const remote = new Remote()
    const readyFunc = jest.fn()

    remote.on('ready', readyFunc)

    expect(remote.status).toBe('close')
    remote.connect()

    expect(readyFunc.mock.calls.length).toBe(1)
    expect(remote.status).toBe('ready')
  })

  it('Connects and emmit the error event if unsuccesfull', () => {
    const remote = new Remote()
    const readyFunc = jest.fn()
    const errorFunc = jest.fn()

    remote.on('ready', readyFunc)
    remote.on('error', errorFunc)

    ssh.__mockConnectionError = true
    remote.connect()

    expect(readyFunc.mock.calls.length).toBe(0)
    expect(errorFunc.mock.calls.length).toBe(1)
    expect(errorFunc.mock.calls[0][0]).toEqual({ error: 'Connection error' })
    expect(remote.status).toBe('error')
  })
})

describe('Remote#close', () => {
  it('Closes the connection and emmit the end event and then close event', () => {
    const remote = new Remote()
    const closeFunc = jest.fn()

    remote.on('end', () => {
      expect(closeFunc.mock.calls.length).toBe(0)
      endFunc()
    })
    remote.on('close', closeFunc)

    remote.connect()
    remote.close()

    expect(closeFunc.mock.calls.length).toBe(1)
    expect(remote.status).toBe('close')
  })
})

describe('Remote#exec', () => {
  it('executes a remote comand and then returns its stdio', async () => {
    const remote = new Remote()
    await remote.connect()

    await remote.exec('test command').then(result => {
      expect(result.stdout).toBe('stdout')
      expect(result.code).toBe(0)
      expect(result.signal).toBe('signal')
    })
  })

  it('streams stdout and stderr before closing', async () => {
    const remote = new Remote()
    const streamFunc = jest.fn()
    await remote.connect()

    await remote.exec('test command', streamFunc).then(result => {
      expect(result.stdout).toBe('stdout')
      expect(result.code).toBe(0)
      expect(result.signal).toBe('signal')
    })

    expect(streamFunc.mock.calls.length).toBe(2)
    expect(streamFunc.mock.calls[0][0]).toBe('stdout')
    expect(streamFunc.mock.calls[1]).toEqual([undefined, 'stderr'])
  })

  it('catches command error and return it', async () => {
    const remote = new Remote()
    await remote.connect()

    ssh.__mockExecError = true
    await remote.exec('test command').catch(result => {
      expect(result).toEqual({ error: 'Exec error' })
    })
  })

  it('catches command error id returned code is not 0 and return it', async () => {
    const remote = new Remote()
    await remote.connect()

    ssh.__mockExecErrorCode = true
    await remote.exec('test command').catch(result => {
      expect(result.stderr).toBe('stderr')
      expect(result.code).toBe(128)
      expect(result.signal).toBe('signal')
    })
  })
})
