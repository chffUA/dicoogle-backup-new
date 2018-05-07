package pt.ua.dicoogle.plugin;

import net.sf.json.JSON;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.eclipse.jetty.http.HttpStatus;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

public class AnnotationService extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private static Map<String, Map<String, Annotation>> map = new HashMap<String, Map<String, Annotation>>();
    private static AtomicInteger atm = new AtomicInteger(0);

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String image_uid = req.getParameter("image_uid");
        if (image_uid == null) {
            resp.sendError(HttpStatus.BAD_REQUEST_400, "You must always provide a Series Instance UID");
            return;
        }

        Map<String, Annotation> col = map.get(image_uid);
        if (col == null) {
            col = Collections.emptyMap();
        }
        JSON ret;

        String uid = req.getParameter("uid");
        if (uid == null) {

            JSONArray tmp = new JSONArray();
            for (Annotation a : col.values()) {
                tmp.add(a.toJSON());
            }
            ret = tmp;

        } else {

            Annotation ann = col.get(uid);
            if (ann == null) {
                resp.sendError(HttpStatus.BAD_REQUEST_400, String.format("Could not find annotation ( %s , %s )", image_uid, uid));
                return;
            }
            ret = ann.toJSON();

        }

        resp.setContentType("application/json");
        resp.setStatus(HttpStatus.OK_200);
        resp.getWriter().print(ret.toString());
        resp.getWriter().flush();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String annotation = req.getParameter("annotation");
        if (annotation == null) {
            resp.sendError(HttpStatus.BAD_REQUEST_400, "No annotation provided");
            return;
        }

        String type = req.getParameter("type");
        if (type == null) {
            resp.sendError(HttpStatus.BAD_REQUEST_400, "No type provided");
            return;
        }

        String image_uid = req.getParameter("image_uid");
        if (image_uid == null) {
            resp.sendError(HttpStatus.BAD_REQUEST_400, "No image_uid provided");
            return;
        }

        boolean createNew = false;
        String uid = req.getParameter("uid");
        if (uid == null) {
            //CREATE A NEW UID
            uid = Integer.toString(atm.getAndIncrement());
            createNew = true;
        }

        Annotation ann = new Annotation(image_uid, uid, annotation, type);

        Map<String, Annotation> idAndAnnotation = map.get(image_uid);
        if (idAndAnnotation == null) {
            idAndAnnotation = new HashMap<String, AnnotationService.Annotation>();
            idAndAnnotation.put(ann.uid, ann);
            map.put(image_uid, idAndAnnotation);
        } else {
            idAndAnnotation.put(ann.uid, ann);
        }

        JSONObject r = new JSONObject();
        r.put("action", (createNew) ? "NEW" : "UPDATE");
        r.put("uid", ann.uid);

        resp.setContentType("application/json");
        resp.setStatus(HttpStatus.OK_200);
        resp.getWriter().print(r.toString());
        resp.getWriter().flush();
        //uid	annotation	type	image_uid
    }


    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String uid = req.getParameter("uid");
        String image_uid = req.getParameter("image_uid");
        if (uid == null || image_uid == null) {
            resp.sendError(HttpStatus.BAD_REQUEST_400, "You should provide both the annotation uid and the series uid");
            return;
        }

        Map<String, Annotation> imageAnnotations = map.get(image_uid);

        if (imageAnnotations == null) {
            imageAnnotations = Collections.emptyMap();
        } else {
            imageAnnotations.remove(uid);
        }

        map.remove(image_uid);
        map.put(image_uid, imageAnnotations);

        resp.setStatus(HttpStatus.OK_200);
        resp.getWriter().close();
    }

    private class Annotation {

        private String image_uid, uid, annotation, type;

        public Annotation(String image_uid, String uid, String annotation, String type) {
            this.image_uid = image_uid;
            this.uid = uid;
            this.annotation = annotation;
            this.type = type;
        }

        public Annotation(String image_uid, String uid) {
            this(image_uid, uid, null, null);
        }

        @Override
        public int hashCode() {
            final int prime = 31;
            int result = 1;
            result = prime * result + getOuterType().hashCode();
            result = prime * result + ((image_uid == null) ? 0 : image_uid.hashCode());
            result = prime * result + ((uid == null) ? 0 : uid.hashCode());
            return result;
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj)
                return true;
            if (obj == null)
                return false;
            if (getClass() != obj.getClass())
                return false;
            Annotation other = (Annotation) obj;
            if (!getOuterType().equals(other.getOuterType()))
                return false;
            if (image_uid == null) {
                if (other.image_uid != null)
                    return false;
            } else if (!image_uid.equals(other.image_uid))
                return false;
            if (uid == null) {
                if (other.uid != null)
                    return false;
            } else if (!uid.equals(other.uid))
                return false;
            return true;
        }

        private AnnotationService getOuterType() {
            return AnnotationService.this;
        }

        public JSONObject toJSON() {
            JSONObject ret = new JSONObject();
            ret.put("uid", this.uid);
            ret.put("annotation", this.annotation);
            ret.put("type", this.type);
            ret.put("image_uid", this.image_uid);
            return ret;
        }

        @Override
        public String toString() {
            return "Annotation{" +
                    "image_uid='" + image_uid + '\'' +
                    ", uid='" + uid + '\'' +
                    ", annotation='" + annotation + '\'' +
                    ", type='" + type + '\'' +
                    '}';
        }
    }

}
