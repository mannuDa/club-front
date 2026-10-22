import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StyleService {

  loadStyle(id: string, href: string) {
    if (document.getElementById(id)) return;

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;

    document.head.appendChild(link);
  }

  removeStyle(id: string) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  loadScript(id: string, src: string) {
    if (document.getElementById(id)) return;

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.type = 'text/javascript';
    script.defer = true;

    document.body.appendChild(script);
  }

  removeScript(id: string) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
}