package pt.ua.dicoogle.plugin;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.Arrays;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import org.dcm4che2.data.DicomElement;
import org.dcm4che2.data.DicomObject;
import org.dcm4che2.data.Tag;
import org.dcm4che2.io.DicomInputStream;
import org.dcm4che2.io.StopTagInputHandler;
import org.eclipse.jetty.http.HttpStatus;

import pt.ua.dicoogle.sdk.StorageInputStream;

/**
 * Simple Helloworld servlet
 * 
 * @author Tiago Marques Godinho, tmgodinho@ua.pt
 *
 */
public class InformationServet extends HttpServlet {

  /**
   * 
   */
  private static final long serialVersionUID = 1L;
   
  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException,
      IOException {
    
    String uriString = req.getParameter("uri");
    if(uriString == null){
      resp.sendError(HttpStatus.BAD_REQUEST_400, "No uri specified");
      return;
    }
    
    URI uri = URI.create(uriString);
    if(uri == null){
      resp.sendError(HttpStatus.BAD_REQUEST_400, "Could not parse the provided URI");
      return;
    }
    
    int columns = -1;
    int rows = -1;
    double[] pixel_spacing = null;
    
    Iterable<StorageInputStream> storages = DWSPluginSet.core.resolveURI(uri);
    for(StorageInputStream is : storages){
      try{
        DicomObject dcmObj = getDICOMObjectFromFile(is.getInputStream());

        rows = dcmObj.getInt(Tag.TotalPixelMatrixRows);
        columns = dcmObj.getInt(Tag.TotalPixelMatrixColumns);
        
        DicomElement tmp = dcmObj.get(Tag.SharedFunctionalGroupsSequence);
        if(tmp != null){
          tmp = tmp.getDicomObject().get(Tag.PixelMeasuresSequence);
          if(tmp != null){
            pixel_spacing = tmp.getDicomObject().getDoubles(Tag.PixelSpacing);
          }     
        }                
        
      }catch(IOException ex){
        ex.printStackTrace();
        columns = -1;
        rows = -1;
      }
      
      if(rows > 0 && columns > 0 ){
        break;
      }
    }
    
    if( rows == -1 && columns == -1 ){
      resp.sendError(HttpStatus.INTERNAL_SERVER_ERROR_500, "Could not find the requested image");
      return;
    }
    
    String image_name = uriString.substring(uriString.lastIndexOf("/")+1, uriString.lastIndexOf("."));
          
    
    JSONObject ret = new JSONObject();
    ret.put("image_name", image_name);
    ret.put("rows", rows);
    ret.put("columns", columns);
    if(pixel_spacing != null){
      double pixel_per_metre = 1000/pixel_spacing[0];
      ret.put("resolution", pixel_per_metre);
    }
    
    
    resp.setContentType("application/json");
    resp.setStatus(HttpStatus.OK_200);
    resp.getWriter().print(ret.toString());
    resp.getWriter().flush();
  }  
  
  public static DicomObject getDICOMObjectFromFile(InputStream file) throws IOException {
    DicomObject dcmObj = null;
    
    DicomInputStream din = new DicomInputStream(file);
    din.setHandler(new StopTagInputHandler(Tag.PixelData));
    dcmObj = din.readDicomObject();
   
    return dcmObj;
  }

}
