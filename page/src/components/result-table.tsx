import { parseTxtFSM } from '../parse-txtfsm'

export function ResultTable({ result }: { result: ReturnType<typeof parseTxtFSM> }) {
  if (!result.ok) {
    return (
      <div class="empty-state error-state">
        <strong>Parse error</strong>
        <span>{result.message}</span>
      </div>
    )
  }

  if (result.rows.length === 0) {
    return <p class="empty-state">No records matched this template.</p>
  }

  return (
    <table>
      <thead>
        <tr>
          {result.header.map((name) => (
            <th scope="col" key={name}>{name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {result.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {result.header.map((name, columnIndex) => (
              <td key={name}>{row[columnIndex] ?? ''}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
