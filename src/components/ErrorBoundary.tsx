import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component<{children:ReactNode},{error:Error|null}> {
 state:{error:Error|null}={error:null};
 static getDerivedStateFromError(error:Error){return {error};}
 componentDidCatch(error:Error,info:ErrorInfo){console.error('Japan Honeymoon: error de renderizado',error,info.componentStack);}
 render(){
  if(!this.state.error)return this.props.children;
  return <section className="panel empty" role="alert"><h1>No se ha podido mostrar esta pantalla.</h1><p>Hay un dato o un error que necesita revisión. Tus datos guardados no se han borrado.</p><details><summary>Ver el error</summary><p>{this.state.error.message}</p></details><button className="button primary" onClick={()=>window.location.reload()}>Volver a cargar</button><a className="text-link" href="#/">Volver al inicio</a></section>;
 }
}
