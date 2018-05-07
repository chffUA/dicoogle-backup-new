package pt.ua.dicoogle.plugin;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.Iterator;
import java.util.concurrent.ExecutionException;

import org.dcm4che2.data.DicomObject;
import org.dcm4che2.data.Tag;
import org.dcm4che2.io.DicomInputStream;
import org.dcm4che2.io.StopTagInputHandler;

import net.xeoh.plugins.base.annotations.PluginImplementation;
import pt.ua.dicoogle.sdk.PluginBase;
import pt.ua.dicoogle.sdk.StorageInputStream;
import pt.ua.dicoogle.sdk.core.DicooglePlatformInterface;
import pt.ua.dicoogle.sdk.datastructs.SearchResult;

/**
 * Dicoogle Whole Slide Imaging plugin set
 * 
 * @author Tiago Marques Godinho, tmgodinho@ua.pt
 *
 */
@PluginImplementation
public class DWSPluginSet extends PluginBase {
   
  @Override
  public void setPlatformProxy(DicooglePlatformInterface core) {
    // TODO Auto-generated method stub
    super.setPlatformProxy(core);
    this.core = core;
  }

  public static DicooglePlatformInterface core = null;
  
  public DWSPluginSet() {
    super();    
    this.jettyPlugins.add(new WebServices());    
  }

  @Override
  public String getName() {
    return "tmg_dwsp";
  }

  /**
   * Helper method to retrieve the URI from SOPInstanceUID in lucene.
   * 
   * @param sop
   * @return
   */
  public static URI retrieveURI(String sop){
  	String query = "SOPInstanceUID:" + sop;

  	Iterable<SearchResult> results = null;
	try {
		results = core.query("lucene", query).get();
	} catch (InterruptedException e) {
		e.printStackTrace();
		return null;
	} catch (ExecutionException e) {
		e.printStackTrace();
		return null;
	}	
  	
  	Iterator<SearchResult> it = results.iterator();
  	while(it.hasNext()) {
  		SearchResult first = it.next();
  		if(first != null){
  			return first.getURI();
  		}
  	}
  	return null;
  }
  
  /**
   * Helper method to retrieve the input stream from the URI.
   * 
   * @param uri
   * @return
   */
  public static StorageInputStream retrieveInputStream(URI uri){
  	Iterator<StorageInputStream> itStream = core.resolveURI(uri, "RANDOM_ACCESS_STREAM").iterator();
  	if(itStream.hasNext())
  		return itStream.next();
  	return null;
  }
  
  public static DicomObject getDICOMObjectFromFile(InputStream file) throws IOException {
    DicomObject dcmObj = null;
    
    DicomInputStream din = new DicomInputStream(file);
    din.setHandler(new StopTagInputHandler(Tag.PixelData));
    dcmObj = din.readDicomObject();
   
    return dcmObj;
  }
  
}
