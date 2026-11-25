import { ArrowRight, RefreshCw, ShipWheel } from 'lucide-react';
import { environmentStatus, fixedContexts, type ClusterFeed } from '../utils/labEvidence';
import { SnapshotTime } from './SnapshotTime';
import { TrustMeshMark } from './TrustMeshMark';

function ContextEndpoint({context, cluster}: {context:string; cluster:ClusterFeed}) {
  const record = cluster.data?.clusters.find(item => item.context === context);
  const reachability = record ? (record.connected ? 'Reachable' : 'Unreachable') : 'Unknown';
  const nodes = record?.connected ? record.nodes : [];
  const readiness = !nodes.length ? 'Unknown' : nodes.every(node => node.ready) ? 'Ready' : 'Not ready';
  let freshness = cluster.isLoading ? 'Loading' : 'API unavailable';
  if (cluster.data) {
    freshness = record ? (cluster.staleReason ? 'Last known' : 'Fresh snapshot') : 'Context not reported';
  }
  return <article className="hub-endpoint" data-context={context}>
    <h3><ShipWheel size={21} aria-hidden="true"/><code>{context}</code></h3>
    <dl><div><dt>Reachability</dt><dd>{reachability}</dd></div>
      <div><dt>Node readiness</dt><dd data-warning={readiness === 'Not ready'}>{readiness}</dd></div></dl>
    <p className="hub-time"><strong>{freshness}</strong>{record && cluster.data &&
      <SnapshotTime value={cluster.data.collectedAt}/>}</p>
  </article>;
}

export function EnvironmentIntegrations({cluster,onVerification}: {cluster:ClusterFeed; onVerification:()=>void}) {
  return <section className="shell-integrations environment-hub">
    <header><div><h1 tabIndex={-1}>Environment Hub</h1>
      <p>Local Kubernetes contexts and future cloud environments.</p></div>
      <button type="button" onClick={cluster.refresh} disabled={cluster.isLoading}>
        <RefreshCw size={15} aria-hidden="true"/>{cluster.isLoading ? 'Refreshing' : 'Refresh'}</button>
    </header>
    <section className="hub-gateway" aria-labelledby="gateway-title">
      <div className="hub-bar"><h2 id="gateway-title">Local Environment Gateway</h2>
        <span role="status">{environmentStatus(cluster)}</span></div>
      <div className="hub-map">
        <div className="hub-floor" aria-hidden="true"/>
        <ContextEndpoint context={fixedContexts[0]} cluster={cluster}/>
        <div className="hub-source">
          <svg className="hub-links" viewBox="0 0 240 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 33H24L39 18H85 M155 18H201L216 33H240"/>
          </svg>
          <div className="hub-seal"><TrustMeshMark size={96}/></div>
          <strong>TrustMesh</strong><span>Read-only observation</span>
        </div>
        <ContextEndpoint context={fixedContexts[1]} cluster={cluster}/>
      </div>
      <footer><code>/api/cluster/status</code><button type="button" className="hub-verification" onClick={onVerification}>
        Open Security Verification <ArrowRight size={15} aria-hidden="true"/></button></footer>
    </section>
    <section className="hub-cloud"><h2>Future Cloud Environments</h2>
      <ul>{[['Amazon EKS','amazon-eks','Managed Kubernetes on AWS'],['Azure AKS','azure-aks','Managed Kubernetes on Microsoft Azure']].map(([name,asset,description])=>
        <li key={name}><img src={'/cloud/'+asset+'.svg'} width="36" height="36" alt=""/>
          <div><strong>{name}</strong><p>{description}</p></div><small>NOT CONNECTED</small></li>)}</ul>
    </section>
  </section>;
}
