import { requirement } from '../lib/community'

const fields = [
  ['need_ic', '证件登记'], ['need_qr', '顾客 QR'],
  ['fee_required', '缴费'], ['bike_allowed', '骑车进入'],
]

export default function CardEntrySummary({ location }) {
  const rules = location.entry_requirements || {}
  const allUnknown = fields.every(([key]) => rules[key] !== true && rules[key] !== false)
  const imported = location.last_modified_by === '公开资料导入'
  return <>
    <div className="rule-callout card-entry-summary">
      <span className="rule-label">进门要求</span>
      <dl className="card-entry-grid">{fields.map(([key, label]) => <div key={key}>
        <dt>{label}</dt>
        <dd className={typeof rules[key] === 'boolean' ? 'entry-known' : 'entry-unknown'}>{key === 'bike_allowed' ? requirement(rules[key], '可以', '不可以') : requirement(rules[key])}</dd>
      </div>)}</dl>
      {allUnknown && <p className="entry-uncertainty">以上项目尚待核实，先联系顾客确认。</p>}
    </div>
    {rules.gate_rule && (imported ? <details className="card-rule-notes">
      <summary>查看公开项目资料</summary>
      <p className="muted">公开设施资料不等于司机现场通关规则。</p>
      <p>{rules.gate_rule}</p>
    </details> : <div className="card-rule-notes">
      <span className="rule-label">规则说明</span><p>{rules.gate_rule}</p>
    </div>)}
    {rules.parking && rules.parking !== '待确认' && <p className="card-parking-note">临时停车：{rules.parking}</p>}
  </>
}
