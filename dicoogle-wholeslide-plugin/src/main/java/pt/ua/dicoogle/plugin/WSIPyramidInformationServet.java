package pt.ua.dicoogle.plugin;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutionException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.dcm4che2.data.DicomElement;

import org.dcm4che2.data.DicomObject;
import org.dcm4che2.data.Tag;
import org.eclipse.jetty.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import pt.ua.dicoogle.sdk.StorageInputStream;
import pt.ua.dicoogle.sdk.datastructs.SearchResult;

/**
 * {@link WSIPyramidInformationServet}
 * 
 * This service provides the WSI image pyramid metadata necessary for
 * visualization purposes. Currently, the Series Instance UID of the WSI Image
 * pyramid is required.
 * 
 * @author Tiago Marques Godinho, tmgodinho@ua.pt
 *
 */
public class WSIPyramidInformationServet extends HttpServlet {

	private static Logger log = LoggerFactory.getLogger(WSIPyramidInformationServet.class);

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

		String serie_instance_uid = req.getParameter("SeriesInstanceUID");
		if (serie_instance_uid == null) {
			String uriString = req.getParameter("uri");
			if (uriString == null) {
				resp.sendError(HttpStatus.BAD_REQUEST_400, "No SeriesInstanceUID or URI specified");
				return;
			}

			URI uri = URI.create(uriString);
			if (uri == null) {
				resp.sendError(HttpStatus.BAD_REQUEST_400, "Could not parse the provided URI");
				return;
			}

		}

		/*
		 * StorageInputStream stream = DWSPluginSet.retrieveInputStream(uri);
		 * DicomObject dcmObj =
		 * DWSPluginSet.getDICOMObjectFromFile(stream.getInputStream());
		 * 
		 * serie_instance_uid = dcmObj.getString(Tag.SeriesInstanceUID);
		 */

		Iterable<SearchResult> results = null;
		try {
			results = DWSPluginSet.core.query("lucene", "SeriesInstanceUID:" + serie_instance_uid).get();
		} catch (InterruptedException e) {
			e.printStackTrace();
			resp.sendError(HttpStatus.BAD_REQUEST_400,
					"Could not find any DICOM instance from the series: " + serie_instance_uid);
			return;
		} catch (ExecutionException e) {
			e.printStackTrace();
			resp.sendError(HttpStatus.BAD_REQUEST_400,
					"Could not find any DICOM instance from the series: " + serie_instance_uid);
			return;
		}
		if (results == null) {
			resp.sendError(HttpStatus.BAD_REQUEST_400,
					"Could not find any DICOM instance from the series: " + serie_instance_uid);
			return;
		}

		WSIPyramidDescriptor base = null;
		List<WSIPyramidDescriptor> subresolution_images = new ArrayList<WSIPyramidDescriptor>();
		for (SearchResult r : results) {

			StorageInputStream stream = DWSPluginSet.retrieveInputStream(r.getURI());
			InputStream str = stream.getInputStream();
			if (str != null) {
				DicomObject dcmObj = DWSPluginSet.getDICOMObjectFromFile(str);
				WSIPyramidDescriptor instance = new WSIPyramidDescriptor(r.getURI(), dcmObj);

				if (instance.isOriginalImage())
					base = instance;
				else if (instance.isSubResolutionImage())
					subresolution_images.add(instance);
			}
		}

		if (base == null) {
			resp.sendError(HttpStatus.BAD_REQUEST_400,
					String.format(
							"Could not find Base Image for the Series: %s. However, found %d subresolution images.",
							serie_instance_uid, subresolution_images.size()));
			return;
		}

		Collections.sort(subresolution_images, new Comparator<WSIPyramidDescriptor>() {

			public int compare(WSIPyramidDescriptor o1, WSIPyramidDescriptor o2) {
				return o2.nframes - o1.nframes;
			}
		});

		JSONObject ret = new JSONObject();
		ret.put("SOPInstanceUID", base.SOPInstanceUID);

		ret.put("width", base.total_columns);
		ret.put("height", base.total_rows);

		ret.put("tile_width", base.tile_width);
		ret.put("tile_height", base.tile_height);

		ret.put("ntiles", base.nframes);

		ret.put("resolution", base.resolution);

		JSONArray arr = new JSONArray();
		for (WSIPyramidDescriptor descr : subresolution_images) {
			JSONObject obj = new JSONObject();
			obj.put("SOPInstanceUID", descr.SOPInstanceUID);

			obj.put("width", descr.total_columns);
			obj.put("height", descr.total_rows);

			obj.put("tile_width", descr.tile_width);
			obj.put("tile_height", descr.tile_height);

			obj.put("ntiles", descr.nframes);
			arr.add(obj);
		}
		ret.put("subresolution_images", arr);

		resp.setContentType("application/json");
		resp.setStatus(HttpStatus.OK_200);
		resp.getWriter().print(ret.toString());
		resp.getWriter().flush();
	}

	private class WSIPyramidDescriptor {

		private int total_columns;
		private int total_rows;
		private int tile_width;
		private int tile_height;
		private String SOPInstanceUID;
		private URI uri;
		private int nframes;
		private String[] image_type;
		private double resolution;

		private boolean isImage;
		private boolean isResampled;

		public WSIPyramidDescriptor(URI uri, DicomObject obj) {
			this.uri = uri;

			this.SOPInstanceUID = obj.getString(Tag.SOPInstanceUID);

			this.total_columns = obj.getInt(Tag.TotalPixelMatrixColumns);
			this.total_rows = obj.getInt(Tag.TotalPixelMatrixRows);

			this.nframes = obj.getInt(Tag.NumberOfFrames);

			this.tile_height = obj.getInt(Tag.Rows);
			this.tile_width = obj.getInt(Tag.Columns);

			this.image_type = obj.getStrings(Tag.ImageType);
			// DERIVED, // PRIMARY, // VOLUME, // RESAMPLED

			if (this.image_type[2].equals("VOLUME")) {
				this.isImage = true;
				this.isResampled = (this.image_type[3].equals("RESAMPLED"));

				DicomElement tmp = obj.get(Tag.SharedFunctionalGroupsSequence);
				double[] pixel_spacing = null;
				if (tmp != null) {
					tmp = tmp.getDicomObject().get(Tag.PixelMeasuresSequence);
					if (tmp != null) {
						pixel_spacing = tmp.getDicomObject().getDoubles(Tag.PixelSpacing);
					}
				}

				if (pixel_spacing != null) {
					this.resolution = pixel_spacing[0];
				}
			} else {
				this.isImage = false;
				this.isResampled = false;
			}
		}

		public boolean isSubResolutionImage() {
			return isImage && isResampled;
		}

		public boolean isOriginalImage() {
			return isImage && !isResampled;
		}

		@Override
		public String toString() {
			return "WSIPyramidDescriptor [total_columns=" + total_columns + ", total_rows=" + total_rows
					+ ", tile_width=" + tile_width + ", tile_height=" + tile_height + ", SOPInstanceUID="
					+ SOPInstanceUID + ", uri=" + uri + ", nframes=" + nframes + ", image_type="
					+ Arrays.toString(image_type) + "]";
		}
	}

}
