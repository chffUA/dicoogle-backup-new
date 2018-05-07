import { Injectable } from '@angular/core';
import { Http, Response, URLSearchParams, Headers, RequestOptions, RequestMethod } from '@angular/http';
import { Observable } from 'rxjs/Observable';

declare var __DEV__: boolean;

@Injectable()
export class AnnotationService {

    private url: string;
    
    constructor(private http: Http) {
        if (__DEV__) {
            this.url = "http://demo.dicoogle.com/tmg/dwsp/annotation";
        } else {
            this.url = window.location.origin + "/tmg/dwsp/annotation";
        }
    }

    getAnnotation(uid: string, image_uid: string): Observable<any[]> {

        let params: URLSearchParams = new URLSearchParams();
        params.set('uid', uid);
        params.set('image_uid', image_uid);

        return this.http.get(this.url, { search: params })
            .map((res: Response) => res.json())
            .catch(this.handleError);
    }

    getAllAnnotations(image_uid: string): Observable<any[]> {

        let params: URLSearchParams = new URLSearchParams();
        params.set('image_uid', image_uid);

        return this.http.get(this.url, { search: params })
            .map((res: Response) => res.json())
            .catch(this.handleError);
    }

    postAnnotation(annotation: any, image_uid:any): Observable<any[]> {
        var headers = new Headers();
        headers.append('Content-Type', 'x-www-form-urlencoded');

        let urlSearchParams = new URLSearchParams();
        urlSearchParams.append('type', annotation.type);
        urlSearchParams.append('image_uid', image_uid);
        urlSearchParams.append('annotation', JSON.stringify(annotation.save()));

        //console.log(annotation, annotation.uid);
        if(annotation.uid != undefined)
            urlSearchParams.append('uid', annotation.uid);
            
        let body = urlSearchParams.toString()
        //console.log("URL", urlSearchParams);

        return this.http.post(this.url + "?" + urlSearchParams.toString(), { headers: headers })
            .map((res: Response) => {
                let body = res.json();                
                annotation["uid"] = body.uid;
                return annotation;
            })
            .catch(this.handleError);
    }

    deleteAnnotation(uid: string, image_uid: string): Observable<any[]> {
        var headers = new Headers();
        headers.append('Content-Type', 'x-www-form-urlencoded');

        let urlSearchParams = new URLSearchParams();
        urlSearchParams.append('uid', uid);
        urlSearchParams.append('image_uid', image_uid);

        return this.http.delete(this.url + "?" + urlSearchParams.toString(), { headers: headers })
            //.map((res: Response) => console.log(res))
            .catch(this.handleError);
    }

    private handleError(error: any) {
        let errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        console.error(errMsg); // log to console instead
        return Observable.throw(errMsg);
    }
}